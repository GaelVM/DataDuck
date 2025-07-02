const fs = require('fs');
const jsd = require('jsdom');
const { JSDOM } = jsd;

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

                // Asegurar carpeta
                if (!fs.existsSync("files")) fs.mkdirSync("files");

                // Escribir archivos
                fs.writeFileSync("files/rocket.json", JSON.stringify(rocketLineups, null, 4));
                fs.writeFileSync("files/rocket.min.json", JSON.stringify(rocketLineups));

                console.log("✅ Rocket lineups guardados correctamente.");

                resolve();
            })
            .catch(err => {
                console.error("❌ Error al obtener Rocket lineups:", err);
                resolve(); // Para evitar colgar main()
            });
    });
}

module.exports = { get };
