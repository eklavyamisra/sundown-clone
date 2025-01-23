const scroll = new LocomotiveScroll({
    el: document.querySelector('.main'),
    smooth: true
});

var elemC = document.querySelector(".elem-container");
var fixed = document.querySelector(".fixed");
elemC.addEventListener("mouseenter",function(){
    fixed.style.display = "block"
})

elemC.addEventListener("mouseleave",function(){
    fixed.style.display = "none"
})

var elems = document.querySelectorAll(".elem");

elems.forEach(function(e){
    e.addEventListener("mouseenter",function(){
        var image = e.getAttribute("data-image");
        fixed.style.backgroundImage = `url(${image})`
    })
})


var h1Elements = document.querySelectorAll(".h1");
var project = document.querySelector(".pro-right");

h1Elements.forEach(function(e) {
    e.addEventListener("mouseenter", function() {
        var image = e.getAttribute("data-image");
        project.style.backgroundImage = `url(${image})`;
    });
});

var loader = document.querySelector(".loader");

setTimeout(function(){
    loader.style.top = "-100%"
},3500)