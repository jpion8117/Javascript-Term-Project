
$(function()
{
    //load the header and the navigation from the main index page
    $("#header").load("index.html #headerContent");
    $("#navigation").load("index.html #links", function(){

        //remove the current page indicator
        $('.current').removeClass("current");

        //add the current page indicator to the correct page
        var currentPage = window.location.pathname.split("/").pop();
        $links = $('nav ul li a');
        $links.each(function(){
            if($(this).attr('href') == currentPage)
            {
                $(this).addClass("current");
                return false;
            }
                
        });
    });

    
});