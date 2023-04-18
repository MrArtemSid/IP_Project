let show = true;
let names = ['shell','pull','push','boot'];

function changeMenu(){
    let menu_div = document.getElementById('menu');
    let child_div = menu_div.childNodes;
    let container = document.getElementById('container');
    let left_side_menu = document.getElementById('left_side_menu');
    let c = 0;
    if(show){
        show = false;
        for(let i = 0; i < child_div.length; i++){
            if(child_div[i].childNodes[0] != undefined){
                child_div[i].childNodes[0].textContent = "";
            }
        }
        container.style.gridTemplateColumns = "4% 96%";

    }else{
        show = true;
        for(let i = 0; i < child_div.length; i++){
            if(child_div[i].childNodes[0] != undefined){
                child_div[i].childNodes[0].textContent = names[c];
                c++;
            }
        }
        left_side_menu.style.width="100%";
        container.style.gridTemplateColumns = "10% 90%";
    }
}

