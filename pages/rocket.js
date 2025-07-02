const fs = require('fs');
const jsd = require('jsdom');
const { JSDOM } = jsd;
const https = require('https');

function get() {
    return new Promise(resolve => {
        JSDOM.fromURL("https://leekduck.com/rocket-lineups/")
            .then((dom) => {
                const document = dom.window.document;
                const cards = document.querySelectorAll(".lineup-card");

                let rocketLineups = [];

                cards.forEach(card => {
                    const lineup = {
                        lineupType: "",
                        introText: "",
                        encounterImage: "",
                        shinyPossible: false,
                        typeIcon: "",
                        pokemonLineups: []
                    };

                    const header = card.querySelector(".lineup-header");
                    if (header) lineup.lineupType = header.textContent.trim();

                    const intro = card.querySelector(".lineup-description");
                    if (intro) lineup.introText = intro.textContent.trim();

                    const rewardImg = card.querySelector(".lineup-reward img");
                    if (rewardImg) lineup.encounterImage = rewardImg.src;

                    const shinyIcon = card.querySelector(".lineup-reward .shiny-icon");
                    if (shinyIcon) lineup.shinyPossible = true;

                    const typeImg = card.querySelector(".lineup-type img");
                    if (typeImg) lineup.typeIcon = typeImg.src;

                    const rows = card.querySelectorAll(".lineup-pokemon-row");
                    rows.forEach(row => {
                        const pokes = [];
                        row.querySelectorAll("img").forEach(img => {
                            const name = img.getAttribute("alt") || "";
                            const src = img.src;
                            pokes.push({ name, image: src });
                        });
                        if (pokes.length > 0) {
                            lineup.pokemonLineups.push(pokes);
                        }
                    });

                    rocketLineups.push(lineup);
                });

                // Guarda los archivos
                if (!fs.existsSync("files")) fs.mkdirSync("files");

                fs.writeFile('files/rocket.json', JSON.stringify(rocketLineups, null, 4), err => {
                    if (err) console.error(err);
                });
                fs.writeFile('files/rocket.min.json', JSON.stringify(rocketLineups), err => {
                    if (err) console.error(err);
                });

                resolve();
            })
            .catch(_err => {
                console.log(_err);
                https.get("https://raw.githubusercontent.com/GaelVM/DataDuck/data/rocket.min.json", (res) => {
                    let body = "";
                    res.on("data", chunk => { body += chunk; });
                    res.on("end", () => {
                        try {
                            let json = JSON.parse(body);
                            if (!fs.existsSync("files")) fs.mkdirSync("files");

                            fs.writeFile('files/rocket.json', JSON.stringify(json, null, 4), err => {
                                if (err) console.error(err);
                            });
                            fs.writeFile('files/rocket.min.json', JSON.stringify(json), err => {
                                if (err) console.error(err);
                            });
                        } catch (error) {
                            console.error(error.message);
                        }
                    });
                }).on("error", error => {
                    console.error(error.message);
                });
            });
    });
}

module.exports = { get };
