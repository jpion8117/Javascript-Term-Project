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

//Start of v2 (requires jQuery)
class SimpleSlider
{
    static nextID = 1000;
    uniqueID;

    $images;
    $buttonContainer;
    jQueryReady = false;
    interval;
    speed;
    index = 0;
    displayAlt = false;
    interactive = true;
    showButtons = true;
    altTag = "h2";
    altClass = "";
    $altContainer;

    //just incase you want to stop and start it after creation
    stop()
    {
        window.clearInterval(this.interval);
    }
    start()
    {
        var si = this;
        this.interval = window.setInterval(function(){si.nextFrame()}, this.speed);
    }

    nextFrame(sliderInstance) 
    {
        //refresh slider
        sliderInstance.refresh();

        //advance index
        sliderInstance.index++

        //wrap if out of bounds
        if(sliderInstance.index >= sliderInstance.$images.length)
            sliderInstance.index = 0;
    }
    goFrame(index)
    {
        //set the current frame
        this.index = index;

        //update display
        this.refresh()
    }
    refresh()
    {
        //update buttons
        $(".bbSelected").removeClass("bbSelected") //remove indicator from current bullet
        $("#sliderButton_"+this.index).addClass("bbSelected"); //add indicator to new selection

        //hide all images
        this.$images.hide();
        this.$images.removeClass("selectedImg_sliderID"+this.uniqueID);

        //show display image at current index
        var instance = this;
        this.$images.each(function(i, elem){
           if(i === instance.index)
           {
                $(elem).show();
                $(elem).addClass("selectedImg_sliderID"+instance.uniqueID);
           }
        });

        //if enabled display alt text...
        if(this.displayAlt && this.$altContainer.length !== 0) //checks first if displayAlt is enabled, then makes sure there is a container for the alt text
        {
            let selector = '.selectedImg_sliderID'+this.uniqueID;
            console.info($(selector));
            this.$altContainer.html("<"+this.altTag+" class=\""+this.altClass+"\">"+$(selector).attr('alt')+"</"+this.altTag+">");
        }
    }

    constructor(c_imageClass, c_buttonContainerID, c_speed = 5000, options = {})
    {
        //assign a unique ID for this instance
        //allows more than one slider per page to function
        this.uniqueID = SimpleSlider.nextID;
        SimpleSlider.nextID++;

        console.log("myID: "+this.uniqueID);
        console.log("nextID: "+SimpleSlider.nextID);

        var sliderInstance = this;

        //check if jQuery is loaded
        if(typeof window.jQuery !== 'undefined')
        {
            this.jQueryReady = true;
        }
        else
        {
            console.log("SimpleSlider requires jQuery for it's core functionality, please ensure that jQuery is loaded before" +
                "continuing...");
            return;
        }

        //manditory settings
        this.$images = $("."+c_imageClass);
        this.$buttonContainer = $("#"+c_buttonContainerID);
        this.speed = c_speed;

        //optional settings
        //alt image display buttons
        if(options.displayAlt && options.altContainerID && typeof options.displayAlt === "boolean") this.displayAlt = options.displayAlt;
        if(options.altContainerID && typeof options.altContainerID === "string") this.$altContainer = $("#"+options.altContainerID);
        if(options.altTag && typeof options.altTag === "string") this.altTag = options.altTag;
        if(options.altClass && typeof options.altClass === "string") this.altClass = options.altClass;

        //interactivity and bullet buttons
        if(options.interactive && options.showButtons === true && typeof options.interactive === "boolean") this.interactive = options.interactive;
        if(options.showButtons && typeof options.showButtons === "boolean") this. showButtons = options.showButtons;

        //make buttons
        var buttonsHTML = "";
        this.$images.each(function(i)
        {
            buttonsHTML += "<a href=\"#\" class=\"bulletButton\" id=\"sliderButton_"+ i +"\">&bull;</a> ";
        });
        this.$buttonContainer.html(buttonsHTML)

        //make buttons clickable if interactive is enabled (default state)
        if(this.interactive)
        {
            $(".bulletButton").on("click", function(e, slider = sliderInstance)
            {
                //                                                               ˅ lol, I accidently made a face...
                var index = e.currentTarget.id.slice(e.currentTarget.id.indexOf("_")+1);
                
                //force js to treat as a number
                index++;
                index--;
                
                sliderInstance.goFrame(index);
            });
        }

        //timer
        this.nextFrame(sliderInstance); //run next frame once;
        
        this.interval = window.setInterval(function(){ sliderInstance.nextFrame(sliderInstance); }, this.speed);
    }
}