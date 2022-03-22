var slider = new Object({slides:[], speed: 0, displayAlt: false, current: 0});

function initSlider(sources, speed, displayAlt = false)
{
    console.log("test output");
    //assemble slide object
    var slide = new Object();

    //populate slides
    for (let i = 0; i < sources.length; ++i)
    {
        slide = new Object();

        console.log(sources[i].src);
        slide.src = sources[i].src;
        if(sources[i].alt)
            slide.alt = sources[i].alt;
        else
            slide.alt = "";
        
        slider.slides.push(slide);
    }
    console.log(slider.slides)
    //populate indicators
    var html = "";
    var indicatorCaption = document.getElementById("sliderIndicators")
    for (let i = 0; i < slider.slides.length; ++i)
    {
        html += "<span class=\"fa fa-circle-o\" id=\"indicator" + i + "\"></span>";
    }
    indicatorCaption.innerHTML = html;

    //set other settings
    slider.speed = speed;
    slider.displayAlt = displayAlt;

    //make do stuff... ???
    sliderRun();
    window.setInterval(sliderRun, slider.speed);
}
function sliderRun()
{
    //reset indicators
    if(document.getElementsByClassName("fa-circle")[0])
        document.getElementsByClassName("fa-circle")[0].setAttribute("class", "fa fa-circle-o");

    //incriment current
    slider.current++

    //check bounds
    if (slider.current == slider.slides.length)
        slider.current = 0;

    //set current indicator
    document.getElementById("indicator" + slider.current).setAttribute("class", "fa fa-circle");

    //set image attributes
    var image = document.getElementById("sliderImg");
    image.setAttribute("src", slider.slides[slider.current].src);
    image.setAttribute("alt", slider.slides[slider.current].alt);
    
    //display alt if enabled
    if(slider.displayAlt)
        document.getElementById("sliderAlt").innerText = slider.slides[slider.current].alt;
}