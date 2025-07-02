const fs = require('fs');
const puppeteer = require('puppeteer');

async function get() {
    const browser = await puppeteer.launch({
  headless: "new",
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
    const page = await browser.newPage();

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115 Safari/537.36');
    await page.goto('https://leekduck.com/rocket-lineups/', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('.rocket-profile', { timeout: 30000 });

    const rocketLineups = await page.evaluate(() => {
        const profiles = document.querySelectorAll(".rocket-profile");
        const result = [];

        profiles.forEach(profile => {
            const leaderName = profile.querySelector(".name")?.textContent.trim() || "";
            const leaderTitle = profile.querySelector(".title")?.textContent.trim() || "";
            const quote = profile.querySelector(".quote-text")?.textContent.trim() || "";
            const image = profile.querySelector(".photo img")?.src || "";
            const typeIcon = profile.querySelector(".type img")?.src || "";

            const lineup = [];
            const slots = profile.querySelectorAll(".slot");

            slots.forEach(slot => {
                const pokes = [];
                const isEncounter = slot.classList.contains("encounter");
                const shadowPokes = slot.querySelectorAll(".shadow-pokemon");

                shadowPokes.forEach(poke => {
                    const name = poke.dataset.pokemon || "";
                    const type1 = poke.dataset.type1 || "";
                    const type2 = poke.dataset.type2 || "None";
                    const singleWeaknesses = poke.dataset.singleWeaknesses?.split(',').filter(Boolean) || [];
                    const doubleWeaknesses = poke.dataset.doubleWeaknesses?.split(',').filter(Boolean) || [];
                    const shiny = poke.querySelector(".shiny-icon") !== null;

                    pokes.push({ name, type1, type2, singleWeaknesses, doubleWeaknesses, isEncounter, canBeShiny: shiny });
                });

                if (pokes.length > 0) lineup.push(pokes);
            });

            result.push({
                leader: leaderName,
                title: leaderTitle,
                quote,
                image,
                type: typeIcon,
                lineup
            });
        });

        return result;
    });

    if (!fs.existsSync("files")) fs.mkdirSync("files");
    fs.writeFileSync("files/rocket.json", JSON.stringify(rocketLineups, null, 4));
    fs.writeFileSync("files/rocket.min.json", JSON.stringify(rocketLineups));

    console.log(`✅ Scrapeado ${rocketLineups.length} lineups Rocket.`);

    await browser.close();
}

module.exports = { get };
