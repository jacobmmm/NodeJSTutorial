var array = [1, 2, 3, 4, 5];

array.forEach(function(element) {
    console.log(element+"Hello");
})

let filterArr = array.filter((element) =>{
    if(element > 2) {
        return element;
    }
})

console.log(array.indexOf(4));

await fetch('http://randomuser.me/api/')