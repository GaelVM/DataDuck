const fs = require('fs');
const puppeteer = require('puppeteer');

async function get() {
    const browser = await puppeteer.launch({
  headless: "new",
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
    const page = await browser.newPage();

    await page.goto('https://leekduck.com/research/', { waitUntil: 'domcontentloaded' });

    // Haz clic en "All Rewards" para activar todas las tareas
    await page.click('label[for="all-option"]');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const researchData = await page.evaluate(() => {
        const research = [];

        const taskNameToID = {
            "Event Tasks": "event",
            "Catching Tasks": "catch",
            "Throwing Tasks": "throw",
            "Battling Tasks": "battle",
            "Exploring Tasks": "explore",
            "Training Tasks": "training",
            "Team GO Rocket Tasks": "rocket",
            "Buddy & Friendship Tasks": "buddy",
            "AR Scanning Tasks": "ar",
            "Sponsored Tasks": "sponsored"
        };

        document.querySelectorAll('.task-category').forEach(cat => {
            let typeLabel = cat.querySelector('h2')?.innerText.trim();

            // Mapeo especial: si es la primera categoría (normalmente eventos), forzarla a "Event Tasks"
            if (cat === document.querySelector('.task-category')) {
                typeLabel = "Event Tasks";
            }

            const type = taskNameToID[typeLabel] || "unknown";

            cat.querySelectorAll('.task-list .task-item').forEach(task => {
                const text = task.querySelector('.task-text')?.innerText.trim();
                const rewards = [];

                task.querySelectorAll('.reward').forEach(r => {
                    if (r.dataset.rewardType === "encounter") {
                        const name = r.querySelector('.reward-label span')?.innerText.trim() || "";
                        const image = r.querySelector('.reward-image')?.src || "";

                        const minCPText = r.querySelector('.min-cp')?.innerText.trim() || "";
                        const maxCPText = r.querySelector('.max-cp')?.innerText.trim() || "";

                        const min = parseInt(minCPText.match(/\d+/)?.[0] || "-1");
                        const max = parseInt(maxCPText.match(/\d+/)?.[0] || "-1");

                        const canBeShiny = r.querySelector('.shiny-icon') !== null;

                        rewards.push({
                            name,
                            image,
                            canBeShiny,
                            combatPower: {
                                min: isNaN(min) ? null : min,
                                max: isNaN(max) ? null : max
                            }
                        });
                    }
                });

                if (rewards.length > 0) {
                    const existing = research.find(r => r.text === text && r.type === type);
                    if (existing) {
                        rewards.forEach(rw => existing.rewards.push(rw));
                    } else {
                        research.push({ text, type, rewards });
                    }
                }
            });
        });

        return research;
    });

    if (!fs.existsSync('files')) fs.mkdirSync('files');
    fs.writeFileSync('files/research.json', JSON.stringify(researchData, null, 4));
    fs.writeFileSync('files/research.min.json', JSON.stringify(researchData));

    console.log(`✅ Scrapeadas ${researchData.length} tareas de investigación.`);

    await browser.close();
}

module.exports = { get };
