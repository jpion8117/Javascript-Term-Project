class SimpleModal
{
    //not sure if I will need this for anything, but it could come in handy
    static nextID = 1000;
    uniqueID;

    //define modal location
    posX = "25%";
    posY = "25%";
    width = "50%";
    height = "50%";

    modalClass = "SM_Modal";
    modalSelector = "." + this.modalClass;
    modalContentHTML;

    closeBtnClassExt = "Btn";
    closeBtnInnerHTML = "Close X";
    closeBtnHTML = "<div class=\""+this.modalClass+"_"+this.closeBtnClassExt+"\">"+this.closeBtnInnerHTML+"</div>";
    closeBtnSelector = this.modalSelector + "_" + this.closeBtnClassExt;
    closeBtnLocation = "topLeft"; //valid options topRight, topLeft(default), bottomRight, BottomLeft anything else will use default

    jQueryReady = false;

    dimBackground = true;
    dimColor = "black";
    dimOpacity = 75; //expressed as a percentage 0-100

    ext = {}; //contains any additional things the modal may need 

    open(instance)
    {
        if(!instance.jQueryReady)
        {
            console.log("SimpleModal requires jQuery to be loaded first. Please make sure you load jQuery before attempting to use SimpleModal...");
            return;
        }

        instance.beforeOpen();
        
        //dim the background if dim background was chosen
        if(instance.dimBackground)
            $("body").append("<div style=\"background-color: "+instance.dimColor+"; position: fixed; top: 0px; " +
                                "left: 0px; width: 100%; height: 100%; opacity: "+instance.dimOpacity+"%;\" class=" +
                                "\""+instance.modalClass+"_dimLayer\"></div>");
        else
            $("body").append("<div style=\"position: fixed; top: 0px; " +
                                "left: 0px; width: 100%; height: 100%;\" class=" +
                                "\""+instance.modalClass+"_dimLayer\"></div>"); //invisible layer to click out of modal window
        
        //add the modal window to the body
        $("body").append("<div class=\""+instance.modalClass+"\"></div>");

        //format the window according to settings
        $(instance.modalSelector).css(
            {
                position: "fixed",
                left: instance.posX,
                top: instance.posY,
                width: instance.width,
                height: instance.height
            }
        )
        .html(instance.modalContentHTML + instance.closeBtnHTML);

        var i = instance;
        $(instance.modalSelector+"_dimLayer").on("click", function(e){i.close(i)});
        $(instance.closeBtnSelector).on("click", function(e,){i.close(i)});

        //prevents clicking within modal window from bubbling up (I think... [update: IT DID!!!!])
        $(instance.modalSelector).on("click",function(e){e.stopPropagation()});

        //ensures the modal handles resizing dynamically
        $(window).on("resize", function(e, i = instance)
        {
            i.close(i);
            i.open(i);
        });

        //position the close button
        //get modal window dimensions
        var modalWidth = $(instance.modalSelector).css("width");
            modalWidth = modalWidth.slice(0, modalWidth.length-2);
            modalWidth++;
            modalWidth--;

        var modalHeight = $(instance.modalSelector).css("height");
            modalHeight = modalHeight.slice(0, modalHeight.length-2);
            modalHeight++;
            modalHeight--;

        var modalTop = $(instance.modalSelector).css("top");
            modalTop = modalTop.slice(0, modalTop.length-2);
            modalTop++;
            modalTop--;

        var modalLeft = $(instance.modalSelector).css("left");
            modalLeft = modalLeft.slice(0, modalLeft.length-2);  
            modalLeft++;
            modalLeft--;               

        //get close button width height
        $(instance.closeBtnSelector).css("width","fit-content")
        $(instance.closeBtnSelector).css("box-sizing","border-box")
        var closeBtnTop = 0;
        var closeBtnLeft = 0;

        var closeBtnWidth = $(instance.closeBtnSelector).css("width");
            closeBtnWidth = closeBtnWidth.slice(0, closeBtnWidth.length-2);
            closeBtnLeft++;
            closeBtnLeft--;
        
        var closeBtnHeight = $(instance.closeBtnSelector).css("height");
            closeBtnHeight = closeBtnHeight.slice(0, closeBtnHeight.length-2);
            closeBtnHeight++;
            closeBtnHeight--;

        $(instance.closeBtnSelector).css("position", "fixed");

        //position close button
        switch(instance.closeBtnLocation.toLowerCase())
        {
            case "topright":
                closeBtnTop = modalTop + closeBtnHeight;
                closeBtnLeft = modalLeft;
                break;
            case "bottomright":
                closeBtnTop = modalTop + modalHeight - closeBtnHeight;
                closeBtnLeft = modalLeft;
                break;
            case "bottomleft":
                closeBthTop = modalTop + modalHeight - closeBtnHeight;
                closeBtnLeft = modalLeft + modalWidth - closeBtnWidth;
                break;
            default:
                closeBtnTop = modalTop + closeBtnHeight;
                closeBtnLeft = modalLeft + modalWidth - closeBtnWidth
                break;
        }

        $(instance.closeBtnSelector).css("left", closeBtnLeft+"px");
        $(instance.closeBtnSelector).css("top", closeBtnTop+"px");

        instance.afterOpen();
    }
    close(instance)
    {
        if(!instance.jQueryReady)
        {
            console.log("SimpleModal requires jQuery to be loaded first. Please make sure you load jQuery before attempting to use SimpleModal...");
            return;
        }

        instance.beforeClose();

        $(instance.modalSelector).remove();
        $(instance.modalSelector+"_dimLayer").remove();

        instance.afterClose();
    }

    //add some level of custom calls before/after open/close
    beforeOpen(){} //intended to be overridden for custom functionality before opening modal
    afterOpen(){} //intended to be overridden for custom functionality after opening modal
    beforeClose(){} //intended to be overridden for custom functionality before closeing modal
    afterClose(){} //intended to be overridden for custom functionality after closeing modal

    constructor(contentStr, options = {})
    {
        //assign a uniqueID
        this.uniqueID = SimpleModal.nextID;
        SimpleModal.nextID++;

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

        //copy content
        this.modalContentHTML = contentStr;

        //set position parameters
        if(options.posX && typeof options.posX === "number") this.posX = options.posX;
        if(options.posY && typeof options.posY === "number") this.posY = options.posY;
        if(options.width && typeof options.width === "number") this.width = options.width;
        if(options.height && typeof options.height === "number") this.height = options.height;

        //set before and after functions
        if(options.beforeOpen && typeof options.beforeOpen === "function") this.beforeOpen = options.beforeOpen;
        if(options.beforeClose && typeof options.beforeClose === "function") this.beforeClose = options.beforeClose;
        if(options.afterOpen && typeof options.afterOpen === "function") this.afterOpen = options.afterOpen;
        if(options.afterClose && typeof options.afterClose === "function") this.afterClose = options.afterClose;

        //dimming preferences
        if(options.dimBackground && typeof options.dimBackground === "boolean") this.dimBackground = options.dimBackground;
        if(options.dimColor && typeof options.dimColor === "string") this.dimColor = options.dimColor;
        if(options.dimOpacity && typeof options.dimOpacity === "number") this.dimOpacity = options.dimOpacity;

        //add ext
        if(options.ext && typeof options.ext === "object") this.ext = options.ext;

        console.log("New SimpleModal created, ready to display");
    }
}

console.log("SimpleModal Ready...")