let adb;
let webusb;
let input;
let btn;
let area;


let log = (...args) => {
    if (args[0] instanceof Error) {
        console.error.apply(console, args);
    } else {
        console.log.apply(console, args);
    }
    document.getElementById('area').innerHTML += "<pre>" + args.join(' ') + '</pre>';
    area.scrollTop = area.scrollHeight;
};

let init = async () => {
    log('Инициализация');
    webusb = await Adb.open("WebUSB");
    log("Инициализация оконченна");
};

let show_error = async () => {
    alert("Сначала подключите ваше устройство ");
};

let connect = async () => {
    await init();
    log('Подключение');
    if (webusb.isAdb()) {
        try {
            adb = null;
            adb = await webusb.connectAdb("host::", () => {
                log("Разрешите отладку на своем устройстве " + webusb.device.productName + ".");
            });
            log("Подключено");
        } catch(error) {
            log(error);
            adb = null;
        }
    }
};

let disconnect = async () => {
    if(!webusb) {
        show_error();
        return;
    }
    webusb.close();
    log('Отключено');
    webusb = null
};

let adb_sideload = async () => {
    if (!webusb) {
        await show_error();
        return;
    }
    if (webusb.isAdb()) {
        let flashing = true;
        let progress = 0;

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
    if(!input.value.length || !input.value.match("[0-9a-zA-Z]"))
        return;
    let command = document.getElementById('shell_input').value;
    let decoder = new TextDecoder();

    if(command == "clear"){
        area.innerHTML = "";
        return;
    }
    if (!webusb) {
        await show_error();
        return;
    }
    try {
        if (adb != null ) {

            shell = await adb.open("shell:"+ command);

            r = await shell.receive();
            while (r.cmd == "WRTE") {
                if (r.data != null) {
                    log(decoder.decode(r.data));
                }
                shell.send("OKAY");
                r = await shell.receive();
            }
        }
    }
    catch(error) {
        console.log(error);
        //webusb = null;
    }
}
let add_ui = () => {
    //Adb.Opt.use_checksum = true;
    Adb.Opt.debug = true;

    input = document.getElementById('shell_input');
    btn = document.getElementById('show_btn');
    area = document.getElementById('area');

    document.getElementById('connect').onclick = connect;
    document.getElementById('disconnect').onclick = disconnect;
    document.getElementById('show_btn').onclick = adb_shell;
    document.getElementById('sideload').onclick = adb_sideload;
    document.getElementById('clear').onclick = () => {
        document.getElementById('area').innerHTML = '';
    };
};
function enter_msg(e, force = false){
    if ((e != null && e.key == "Enter") || force){
        if(!input.value.length || !input.value.match("[0-9a-zA-Z]") || !webusb) {
            show_error();
            return;
        }
        log( "<font color='#018686' size='3px' style='background:#fafafa; padding:2px;'>shell</font>" + "<font color='#fafafa' size='3px' style='background:#018686; border-bottom-right-radius: 6px; border-top-right-radius: 6px; padding:2px; padding-right:3px; margin-right:5px;'>→</font>"+input.value + "<br>");
        adb_shell();
        input.value = "";
    }
}
function stop_msg(e){
    if(e.code == "KeyC" && (e.ctrlKey || e.metaKey)){
        input.value = "^C";
        enter_msg(null, true);
    }
}

addEventListener("keydown",enter_msg);
addEventListener("keydown",stop_msg);

document.addEventListener('DOMContentLoaded', add_ui, false);