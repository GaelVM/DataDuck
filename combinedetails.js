const fs = require('fs');
const translate = require('google-translate-api');

function main() {
    var events = JSON.parse(fs.readFileSync("./files/events.min.json"));

    fs.readdir("files/temp", function (err, files) {
        if (err) {
            return console.log('No se pudo escanear el directorio: ' + err);
        }

        files.forEach(f => {
            var data = JSON.parse(fs.readFileSync("./files/temp/" + f));

            events.forEach(e => {
                if (e.eventID == data.id) {
                    if (data.type == "research-breakthrough") {
                        e.extraData = { breakthrough: data.data }
                    } else if (data.type == "pokemon-spotlight-hour") {
                        e.extraData = { spotlight: data.data }
                    } else if (data.type == "community-day") {
                        e.extraData = { communityday: data.data }
                    } else if (data.type == "raid-battles") {
                        e.extraData = { raidbattles: data.data }
                    }
                }
            });
        });

        fs.writeFile('files/events.json', JSON.stringify(events, null, 4), err => {
            if (err) {
                console.error('Error al escribir el archivo en español: ' + err);
                return;
            }
        });
        fs.writeFile('files/events.min.json', JSON.stringify(events), err => {
            if (err) {
                console.error('Error al escribir el archivo en español: ' + err);
                return;
            }
        });

        fs.rm("files/temp", { recursive: true }, (err) => {
            if (err) {
                console.error('Error al eliminar el directorio en español: ' + err);
                throw err;
            }
        });
    });
}

main();
