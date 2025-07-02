const fs = require('fs');
const { JSDOM } = require('jsdom');

async function getRocketLineups() {
    const dom = await JSDOM.fromURL("https://leekduck.com/rocket-lineups/");
    const document = dom.window.document;

    const allCards = document.querySelectorAll(".lineup-card");
    const results = [];

    allCards.forEach(card => {
        const lineup = {
            lineupType: "",
            introText: "",
            encounterImage: "",
            shinyPossible: false,
            typeIcon: "",
            pokemonLineups: []
        };

        // Tipo: Recluta, Líder, Giovanni...
        const header = card.querySelector(".lineup-header");
        if (header) {
            lineup.lineupType = header.textContent.trim();
        }

        // Texto de introducción
        const intro = card.querySelector(".lineup-description");
        if (intro) {
            lineup.introText = intro.textContent.trim();
        }

        // Imagen del encuentro
        const encounter = card.querySelector(".lineup-reward img");
        if (encounter) {
            lineup.encounterImage = encounter.src;
        }

        // ¿Puede ser shiny?
        const shiny = card.querySelector(".lineup-reward .shiny-icon");
        if (shiny) {
            lineup.shinyPossible = true;
        }

        // Tipo de icono (ej: veneno, agua, etc.)
        const typeIcon = card.querySelector(".lineup-type img");
        if (typeIcon) {
            lineup.typeIcon = typeIcon.src;
        }

        // Pokémon por fases (puede haber 1 a 3 sets)
        const phases = card.querySelectorAll(".lineup-pokemon-row");
        phases.forEach(phase => {
            const options = [];
            phase.querySelectorAll("img").forEach(img => {
                options.push({
                    name: img.getAttribute("alt") || "",
                    image: img.src
                });
            });
            if (options.length > 0) {
                lineup.pokemonLineups.push(options);
            }
        });

        results.push(lineup);
    });

    // Guarda los resultados
    if (!fs.existsSync("files")) fs.mkdirSync("files");

    fs.writeFileSync("files/rocket-lineups.json", JSON.stringify(results, null, 4));
    fs.writeFileSync("files/rocket-lineups.min.json", JSON.stringify(results));
    console.log("✅ Rocket lineups guardados correctamente.");
}

getRocketLineups();
