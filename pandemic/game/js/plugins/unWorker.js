onmessage = async function(e) {
    let proc = JSON.parse(e.data).dat;
    let sc = JSON.parse(e.data).sc;
    let index = 0;
    let spritesRendered = 0;
    let _rendering = [];
    return new Promise((s, f) => {
        for (let i in proc) {
            if (proc[i].particle) {

            } else {
                proc[i].x = 24 + proc[i].sx - (sc.x * 48);
                proc[i].y = 48 + proc[i].sy - (sc.y * 48);


                proc[i].isOnScreen = true;
                if (
                    proc[i].x > -proc[i].width * 2 && proc[i].x < sc.x + sc.width + proc[i].width * 2 &&
                    proc[i].y > -proc[i].height && proc[i].y < sc.y + sc.height + 96 + proc[i].height * 2) {
                    proc[i].isOnScreen = true;
                    spritesRendered++;
                    _rendering.push(proc[i].id);

                } else {
                    proc[i].isOnScreen = false;
                }
            }
            index++;
        }

        s(proc);
    }).then((proc) => {
        postMessage(JSON.stringify({
            dat: proc,
            ren: spritesRendered
        }));
    }).catch(() => {

    })

}