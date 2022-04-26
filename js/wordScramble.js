const LETTER = ['B','C','D','F','G','K','L','M','P','W','Y'];
const LETTER_COMMON = ['H', 'N', 'R', 'S', 'T'];
const LETTER_UNCOMMON = ['J', 'Q', 'V', 'X', 'Z'];
const LETTER_VOWEL = ['A','E','I','O','U'];


$(function()
{
    //make all pieces draggable
    $(".MovableLetter").draggable({
        revert: "invalid"
    });

    $("#letters").droppable({
        accept: ".MovableLetter",
        classes: {"ui-droppable-hover": "onTarget"},
        tolerance: "fit"
    })

    $(".letterDropbox").each(function(i, elem)
    {
        $(elem).attr("id","ltrDrp_"+i);
    });

    $(".letterDropbox").droppable({
        accept: ".MovableLetter", //only accept movable letters
        classes: {"ui-droppable-hover": "onTarget"}, //highlight cells as you hover over them
        tolerance: "fit"
    });


    //letters
    var letters = new Array(10);
    var vowels = 3;
    var common = 4;
    var other = 3;

    //generate the letters
    for (i = 0; i < letters.length; ++i)
    {
        var newLetter;

        //generate "other" letters first (Normally LETTER with chance of LETTER_UNCOMMON generating)
        if(other != 0)
        {
            if (Math.random() > 0.6) //roughly a 40% chance of an uncommon or an additional common letter generating
            {
                if (Math.random() > 0.80)    
                    newLetter = generateLetter("LETTER_UNCOMMON");
                else
                    newLetter = generateLetter("LETTER_COMMON");
            }
            else
            newLetter = generateLetter("LETTER");

            //add a 'U' if a 'Q' was generated and remove one vowel
            if(newLetter == 'Q')
            {
                letters[i] = 'U';
                ++i;
                --vowels;
            }

            //add newly generated letter to the letters array
            letters[i] = newLetter;
            --other;
            continue;
        }
        //add commons
        if(common != 0)
        {
            newLetter = generateLetter("LETTER_COMMON");
            --common;

            //add newly generated letter to the letters array
            letters[i] = newLetter;
            continue;
        }

        //add vowel(s)
        newLetter = generateLetter("LETTER_VOWEL");

        //add newly generated letter to the letters array
        letters[i] = newLetter;
    }

    //shuffle the letters before adding them to the page
    shuffle(letters);

    //addLetters to the page
    $('.MovableLetter').each(function(){
        $(this).html(letters[$(this).index()]);
    });
});

function generateLetter(type)
{
    switch(type)
    {
        case "LETTER_COMMON":
            return LETTER_COMMON[Math.floor(Math.random() * LETTER_COMMON.length)];
            break;
        case "LETTER_UNCOMMON":
            return LETTER_UNCOMMON[Math.floor(Math.random() * LETTER_UNCOMMON.length)];
            break;
        case "LETTER_VOWEL":
            return LETTER_VOWEL[Math.floor(Math.random() * LETTER_VOWEL.length)];
            break;
        default:
            return LETTER[Math.floor(Math.random() * LETTER.length)];
            break;              
    }
}

//admittedly I snagged this example code from StackOverflow...
//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) 
{
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
}