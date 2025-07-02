const fs = require('fs');
const jsd = require('jsdom');
const { JSDOM } = jsd;
const https = require('https');

function get() {
    return new Promise(resolve => {
        JSDOM.fromURL("https://leekduck.com/boss/")
            .then((dom) => {
                const document = dom.window.document;
                const listItems = document.querySelectorAll("#raid-list ul.list > li");

                let bosses = [];
                let currentTier = "";

                listItems.forEach(e => {
                    if (e.classList.contains("header-li")) {
                        const h2 = e.querySelector("h2");
                        currentTier = h2 ? h2.textContent.trim() : "";
                    } else if (e.classList.contains("boss-item")) {
                        const container = e.querySelector(".boss-border");
                        if (!container) return;

                        const boss = {
                            name: "",
                            tier: currentTier,
                            canBeShiny: false,
                            types: [],
                            combatPower: {
                                normal: { min: -1, max: -1 },
                                boosted: { min: -1, max: -1 }
                            },
                            boostedWeather: [],
                            image: ""
                        };

                        // Nombre
                        const nameEl = container.querySelector(".boss-1 .boss-name");
                        if (nameEl) boss.name = nameEl.textContent.trim();

                        // Imagen y shiny
                        container.querySelectorAll(".boss-img img").forEach(img => {
                            if (img.classList.contains("shiny-icon")) {
                                boss.canBeShiny = true;
                            } else {
                                boss.image = img.src;
                            }
                        });

                        // Tipos
                        container.querySelectorAll(".boss-type img").forEach(img => {
                            if (img.className.startsWith("type")) {
                                boss.types.push({ name: img.title.toLowerCase(), image: img.src });
                            }
                        });

                        // CP normal
                        const cpText = container.querySelector(".boss-2")?.textContent.trim().replace("CP", "").trim();
                        if (cpText && cpText.includes("-")) {
                            const [min, max] = cpText.split(" - ");
                            boss.combatPower.normal.min = parseInt(min);
                            boss.combatPower.normal.max = parseInt(max);
                        }

                        // CP potenciado y climas
                        const boostBlock = container.querySelector(".boss-3");
                        if (boostBlock) {
                            boostBlock.querySelectorAll(".boss-weather img").forEach(img => {
                                if (img.className.startsWith("weather")) {
                                    boss.boostedWeather.push({ name: img.title.toLowerCase(), image: img.src });
                                }
                            });

                            const cpBoostText = boostBlock.querySelector(".boosted-cp")?.textContent.trim().replace("CP", "").trim();
                            if (cpBoostText && cpBoostText.includes("-")) {
                                const [min, max] = cpBoostText.split(" - ");
                                boss.combatPower.boosted.min = parseInt(min);
                                boss.combatPower.boosted.max = parseInt(max);
                            }
                        }

                        bosses.push(boss);
                    }
                });

                fs.writeFile('files/raids.json', JSON.stringify(bosses, null, 4), err => {
                    if (err) console.error(err);
                });
                fs.writeFile('files/raids.min.json', JSON.stringify(bosses), err => {
                    if (err) console.error(err);
                });

                resolve();
            })
            .catch(_err => {
                console.log(_err);
                https.get("https://raw.githubusercontent.com/GaelVM/DataDuck/data/raids.min.json", (res) => {
                    let body = "";
                    res.on("data", chunk => { body += chunk; });
                    res.on("end", () => {
                        try {
                            let json = JSON.parse(body);
                            fs.writeFile('files/raids.json', JSON.stringify(json, null, 4), err => {
                                if (err) console.error(err);
                            });
                            fs.writeFile('files/raids.min.json', JSON.stringify(json), err => {
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
