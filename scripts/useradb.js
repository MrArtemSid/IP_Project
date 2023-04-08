let adb;
let webusb;

let log = (...args) => {
    if (args[0] instanceof Error) {
        console.error.apply(console, args);
    } else {
        console.log.apply(console, args);
    }
    document.getElementById('log').innerText += args.join(' ') + '\n';
};

let init = async () => {
    log('init');
    webusb = await Adb.open("WebUSB");
};

let show_error = async () => {
    alert("Please connect device first");
};

let connect = async () => {
    await init();
    log('connect');
    if (webusb.isAdb()) {
        try {
            adb = null;
            adb = await webusb.connectAdb("host::", () => {
                log("Please check the screen of your " + webusb.device.productName + ".");
            });
        } catch(error) {
            log(error);
            adb = null;
        }
    }
};

let disconnect = async () => {
    log('disconnect');
    webusb.close();
};

let adb_sideload = async () => {
    if (!webusb) {
        await show_error();
        return;
    }
    if (webusb.isAdb()) {
        let flashing = true;
        let progress = 0;

        try {
            adb = null;
            adb = await webusb.connectAdb("host::", () => {
                log("Please check the screen of your " + webusb.device.productName + ".");
            });
        } catch (error) {
            log(error);
            adb = null;
        }

        const chunk_size = 64 * 1024;
        let reader = new FileReader();
        let fileToRead = document.getElementById('file').files[0];
        const content = await readFile(fileToRead);
        const stream = await adb.open(`sideload-host:${content.length}:${chunk_size}`);
        let progressTotal = content.length;
        while (flashing) {
            const response = await stream.receive();
            if (response.cmd == 'OKAY') {
                await stream.send('OKAY');
            }
            if (response.cmd != 'WRTE') {
                continue;
            }
            const result = new TextDecoder("utf-8").decode(response.data);
            if (result == 'DONEDONE' || result == 'FAILFAIL') {
                flashing = false;
                break;
            }
            const start = parseInt(result) * chunk_size;
            let end = start + chunk_size;
            if (end > content.length) {
                end = content.length;
            }
            const data = content.slice(start, end);
            await stream.send('WRTE', data);
            await stream.send('OKAY');
            progress += data.length;
        }
    }
};

let adb_shell = async () => {
    if (!webusb) {
        await show_error();
        return;
    }
    if (webusb.isAdb()) {
        try {
            let shell = await adb.shell(document.getElementById('shell_input').value);
            let response = await shell.receive();
            let decoder = new TextDecoder('utf-8');
            let txt = "";
            if (response.data)
                txt = await decoder.decode(response.data);
            log(txt);
        } catch(error) {
            log(error);
            adb = null;
        }
    }
};

let add_ui = () => {
    //Adb.Opt.use_checksum = true;
    Adb.Opt.debug = true;
    Adb.Opt.dump = true;

    document.getElementById('connect').onclick = connect;
    document.getElementById('disconnect').onclick = disconnect;
    document.getElementById('show_btn').onclick = adb_shell;
    document.getElementById('sideload').onclick = adb_sideload;
    document.getElementById('clear').onclick = () => {
        document.getElementById('log').innerText = '';
    };
};

document.addEventListener('DOMContentLoaded', add_ui, false);