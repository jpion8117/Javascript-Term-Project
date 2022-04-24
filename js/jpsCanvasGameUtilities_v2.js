/**************************************************************
 * This will function as a template script for building 
 * canvas based games.
**************************************************************/

function CreateGameMaster(targetID)
{
    try
    {
        this.paper = document.getElementById(targetID);
    }
    catch(err)
    {
        console.log("Failed to initialize canvas. Try checking the spelling of your targetID.");
        console.info(err);
        return;
    }

    this.pen = this.paper.getContext("2d");
    this.interval = null;
    this.gameForegroundObjects = [];
    this.gameBackgroundObjects = [];
    this.framerate = 60;
    this.framesCount = 0;
    this.backgroundColor = "white";
    this.objectID = 1000;
    this.init = function(options = {width: "default", height:"default"})
    {
        //if width and height are not specified when initializing, the width and height set in HTML or CSS will be used.
        if (options.width != NaN && options.width > 0) this.paper.width = options.width;
        if (options.height != NaN && options.height > 0) this.paper.height = options.height;

        //import other options
        if(options.framerate) this.framerate = options.framerate;
        if(options.backgroundColor) this.backgroundColor = options.backgroundColor;

        //start the game loop.
        var tmp = this;
        this.interval = window.setInterval(function() { tmp.gameUpdate(tmp); }, 1000/this.framerate);
    };
    this.gameUpdate = function(game)
    {
        //make sure pen isn't out of ink (verify that getContext("2d") was successful)
        if(!game.pen)
        {
            console.log("Your pen's outta ink mate...");
            game.interval.stopInterval();
        }
        //first step is to clear the frame, I chose fillRect because it can fill the screen with any chosen color
        game.pen.fillStyle = game.backgroundColor;
        game.pen.fillRect(0, 0, game.paper.width, game.paper.height);

        //draws any background elements to the frame first
        for (let i = 0; i < game.gameBackgroundObjects.length; ++i)
        {
            game.gameBackgroundObjects[i].drawFrame(game);
        }

        //processes all foreground elements in four step process
        for (let i = 0; i < game.gameForegroundObjects.length; ++i)
        {
            //step 1: check element's collisions and track them in that element's collision array
            game.gameForegroundObjects[i].checkCollisions(game);

            //step 2: Process any nessassary updates to the frame (by default this function just returns false)
            //        including acting on collisions, getting user input, and moving the element.
            game.gameForegroundObjects[i].updateFrame(game);

            //step 3: Draw the element at it's current position (by default this just draws a square at the coords
            //        of the element, but it can easily be overloaded for other functionality)
            game.gameForegroundObjects[i].drawFrame(game);
            
            //step 4: remove the object from the array if it was marked to be removed. Doing this at this step prevents
            //        errors caused by attempted function calls on dead objects
            if(game.gameForegroundObjects[i].markForRemoval)
            {
                game.gameForegroundObjects.splice(i, 1); //remove element from array
                i--; //adjust i since the array is now one element smaller
            }
        }

        //draw overlay layer
        this.drawOverlay();

        //update the frameCount property. this is used to track when certain events happen in the game
        this.framesCount++
    };
    //this function is called at the end of the game update loop to render an info layer at the top most layer of the screen
    //anything drawn in this layer is automatically the rendered above all background and foreground objects.
    this.drawOverlay = function() {};
    //this is used to force all background objects to reindex. Depending on the number of background objects this could be very resource 
    //intensive and should therefore only be used when nessassary
    this.reindexBGObjects = function()
    {
        for (let i = 0; i < this.gameBackgroundObjects.length; ++i)
        {
            this.gameBackgroundObjects[i].index = i;
        }
    };
}

function GameBGObject(Game, x, y, width, height, options = {color:"black"})
{
    //I litterally can't think of a reason why a uniqueID is needed for background objects, but I figured it
    //really doesn't take much effort to add it
    this.uniqueID = Game.objectID;
    Game.objectID++;

    //set the coords for this object
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    //save the GameObject so methods in this class are perpetually aware of which object they belong to
    this.GameObject = Game;

    //set the background color
    this.color = options.color;

    this.desciption = ""

    //define the default render method
    //this will simply fill in a rectangle with the coords and dimensions provided but can be overridden
    //to do much more!
    this.drawFrame = function(GameObject)
    {
        //make sure pen isn't out of ink (verify that getContext("2d") was successful)
        if(!GameObject.pen)
        {
            console.log("Your pen's outta ink mate...");
            GameObject.interval.stopInterval();
        }

        //first step is to clear the frame, I chose fillRect because it can fill the screen with any chosen color
        GameObject.pen.fillStyle = this.color;
        GameObject.pen.fillRect(this.x, this.y, this.width, this.height);
    };

    //by default, all background objects will render in the order they were declared with with the most recently declared 
    //appearing on top, the folowing methods will allow you to reorder the background draw order on the fly.
    this.moveUp = function()
    {
        //make sure we don't exceed the boundries of the array
        if(this.index === this.GameObject.gameBackgroundObjects.length - 1)
        {
            console.log("BackgroundObject #"+this.uniqueID+" is already at the top of the render stack!");
            console.info(this);
            return;
        }
        
        //save the 
        
        var tmp = this.GameObject.gameBackgroundObjects[this.index + 1];

        //swap the objects around.
        this.GameObject.gameBackgroundObjects[this.index + 1] = this;
        this.GameObject.gameBackgroundObjects[this.index] = tmp;

        //update each object's array index number;
        this.GameObject.gameBackgroundObjects[this.index].index = this.index;
        this.index++;
    };
    this.moveDown = function()
    {
        //make sure we don't exceed the boundries of the array
        if(this.index === 0)
        {    
            console.log("BackgroundObject #"+this.uniqueID+" is already at the bottom of the render stack!");
            console.info(this);
            return;
        }
        
        //save the object currently in front of this one
        var tmp = this.GameObject.gameBackgroundObjects[this.index - 1];

        //swap the objects around.
        this.GameObject.gameBackgroundObjects[this.index - 1] = this;
        this.GameObject.gameBackgroundObjects[this.index] = tmp;

        //update each object's array index number;
        this.GameObject.gameBackgroundObjects[this.index].index = this.index;
        this.index--;
    };
    //the following functions are both very powerful in their percision, but involve moving many elements in the
    //array and therefore may be resource intensive. Use at your own risk!
    this.moveBefore = function(targetID)
    {
        //find target element and get it's index
        var targetIndex = "unknown object";
        for (let i = 0; i < this.GameObject.gameBackgroundObjects.length; ++i)
        {
            if(this.GameObject.gameBackgroundObjects[i].uniqueID === targetID)
            {
                targetIndex = i;
                break;
            }
        }

        //verify element was located
        if(targetIndex === "unknown object") 
        {
            console.log("failed to locate GameBGObject #"+targetID+" please make sure you entered the correct ID.");
        }

        //remove original
        this.GameObject.gameBackgroundObjects.splice(this.index,1);

        //perform move opperation
        if(targetIndex === 0)
        {
            this.GameObject.gameBackgroundObjects.unshift(this);
        }
        else
        {
            this.GameObject.gameBackgroundObjects.splice(targetIndex, 0, this);
        }

        //reindex array elements to ensure they all have the proper index number
        this.GameObject.reindexBGObjects();
    };
    this.moveAfter = function(targetID)
    {
        //find target element and get it's index
        var targetIndex = "unknown object";
        for (let i = 0; i < this.GameObject.gameBackgroundObjects.length; ++i)
        {
            if(this.GameObject.gameBackgroundObjects[i].uniqueID === targetID)
            {
                targetIndex = i;
                break;
            }
        }

        //remove original
        this.GameObject.gameBackgroundObjects.splice(this.index,1);

        //verify element was located
        if(targetIndex === "unknown object") 
        {
            console.log("failed to locate GameBGObject #"+targetID+" please make sure you entered the correct ID.");
        }

        //perform move opperation
        if(targetIndex === this.GameObject.gameBackgroundObjects.length - 1)
        {
            this.GameObject.gameBackgroundObjects.push(this);
        }
        else
        {
            this.GameObject.gameBackgroundObjects.splice(targetIndex, 0, this);
        }
        
        //reindex array elements to ensure they all have the proper index number
        this.GameObject.reindexBGObjects();
    };

    //register with the background object array.
    this.GameObject.gameBackgroundObjects.push(this);

    //save the index number
    this.index = this.GameObject.gameBackgroundObjects.length - 1;

    //load optional parameters
    if(options.desciption) this.desciption = options.desciption;
    if(typeof options.drawFrame === "function") this.drawFrame = options.drawFrame;
}

//Creates a foreground game object with the coords passed to it, then adds the object to the MasterGame.gameForegroundObjects array
//for frame processing.
function GameFGObject(Game, x, y, width, height, options = {})
{
    //get a uniqueID for this object
    //this ID is assigned by the master game object and is unique for every element of the game both background and 
    //foreground
    this.uniqueID = Game.objectID
    Game.objectID++; //iterate the ID so the next one remains unique

    //store the game object that this piece belongs to
    this.GameObject = Game;

    //set the bounding box of this object
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.type = ""; //by default this is blank, but this is used to identify object types for collision detection
    this.overlapObjects = []; //this array contains all the elements overlapping with this one (except itself)
    this.color = "black" //simple default color, designed to be either ignored or overwritten
    
    //Function checks if this element is overlapping with any other foreground elements
    this.checkCollisions = function(Game)
    {
        //reset overlapping objects for this frame
        this.overlapObjects = [];

        //begin searching other objects in the foreground for collisions
        for (let i = 0; i < Game.gameForegroundObjects.length; ++i)
        {
            //indicates loop needs skip (continue statements didn't work for some reason!)
            let skip = false;

            //make sure we're not checking collision on the same object as this
            if(this.uniqueID == Game.gameForegroundObjects[i].uniqueID) skip=true; //obviously this object will overlap itself
            
            if(!skip)
            {
                //check for collisions
                let c = Game.gameForegroundObjects[i];
                if(this.x < c.x + c.width &&
                    this.x + this.width > c.x &&
                    this.y < c.y + c.height &&
                    this.height + this.y > c.y)
                {
                    //registerCollision
                    this.overlapObjects.push(Game.gameForegroundObjects[i]);
                }
            }
        }
    }

    //any elements that need additional processing between frames can override this function others will simply call it and throw out the result
    this.updateFrame = function(){ return false; /* used to quickly verify if custom update code was supplied */ }
    
    //provides basic instructions for drawing this element's current frame (after processing), for more advanced elements (non-rectangular shapes,
    //pre-rendered graphics, text, etc.) this can be overridden to draw the frame in any way needed
    this.drawFrame = function(Game) //can be overridden for custom behavior
    {
        //run pre draw method if it exists
        if(this.preDrawFrame && typeof preDrawFrame === "function") this.preDrawFrame();

        //default draw action
        Game.pen.fillStyle = this.color;
        Game.pen.fillRect(this.x, this.y, this.width, this.height);

        //run post draw method if it exists
        if(this.postDrawFrame && typeof postDrawFrame === "function") this.postDrawFrame();
    }

    //save this element's location in the foregroundObject array
    // this.arrayIndex = Game.gameForegroundObjects.length;

    //put the element in the foreground array. elements will render in the order they were declared (newest elements will render on top) 
    Game.gameForegroundObjects.push(this);

    //make object aware of it's position in the render stack
    this.index = Game.gameForegroundObjects.length - 1;

    //removal indicator
    this.markForRemoval = false; //not imediatly deleting an object it insures it can be removed from the game safely

    this.remove = function()
    {
        this.markForRemoval = true;
    }

    //render position methods
    this.moveUp = function()
    {
        //check if the object is already rendering on top
        if(this.index === this.gameForegroundObjects.length-1)
        {
            console.log("ForegroundObject #"+this.uniqueID+" is already at the top of the render stack!");
            console.info(this);
            return;
        }

        //create a local var to store the current object above this one
        var otherFGO = this.GameObject.gameForegroundObjects[this.index+1];

        //move the objects.
        this.GameObject.gameForegroundObjects[this.index+1] = this.GameObject.gameForegroundObjects[this.index];
        this.GameObject.gameForegroundObjects[this.index] = otherFGO;

        //update both object's index position
        this.GameObject.gameForegroundObjects[this.index].index = this.index;
        this.index++;
    }
    this.moveDown = function()
    {
        //check if the object is already rendering on top
        if(this.index === 0)
        {
            console.log("ForegroundObject #"+this.uniqueID+" is already at the bottom of the render stack!");
            console.info(this);
            return;
        }

        //create a local var to store the current object above this one
        var otherFGO = this.GameObject.gameForegroundObjects[this.index-1];

        //move the objects.
        this.GameObject.gameForegroundObjects[this.index-1] = this.GameObject.gameForegroundObjects[this.index];
        this.GameObject.gameForegroundObjects[this.index] = otherFGO;

        //update both object's index position
        this.GameObject.gameForegroundObjects[this.index].index = this.index;
        this.index--;
    }
    //the following render stack methods should be used sparingly as they have the potential to be very resource intesive due to the
    //reindexing of many elements. 
    this.sendToBack = function()
    {
        while(this.index !== 0)
        {
            this.moveDown();
        }
    }
    this.sendToFront = function()
    {
        while(this.index !== this.gameForegroundObjects.length-1)
        {
            this.moveUp();
        }
    }
    //set optional parameters
    if(options.type) this.type = options.type;
    if(options.color) this.color = options.color;
    if(typeof options.updateFrame === "function") this.updateFrame = options.updateFrame;
    if(typeof options.drawFrame === "function") this.drawFrame = options.drawFrame;
    if(typeof options.preDrawFrame === "function") this.preDrawFrame = options.preDrawFrame;
    if(typeof options.postDrawFrame === "function") this.postDrawFrame = options.postDrawFrame;
}

Sprite = {
    //can be used to call the default render function from within a custom one. Provided mostly as a convienence
    //when defining a custom render method
    render: function(sprite, game, x, y, scale = 1)
    {
        //get the current cell location
        var cellRow = Math.floor(sprite.frame / sprite.rows);
        var cellCol = Math.floor(sprite.frame % sprite.rows);

        //draw the image using the game object
        game.pen.drawImage( sprite.image, 
                            cellCol * sprite.frameW, cellRow * sprite.frameH,
                            sprite.frameW, sprite.frameH,
                            x, y,
                            sprite.frameW * scale, sprite.frameH * scale
                          );
    },
    spriteRegistration: []
};


function GameSprite(url, frameW, frameH, columns, rows, options = {})
{
    //log creation of sprite for error checking
    if(options.debugLogCreation) console.log("Creating new generic sprite with these attributes.\nurl: "+url+"\nframeW: "+frameW+"\nframeH: "+frameH+
                "\ncolumns: "+columns+"\nrows:"+rows+"\noptions: "+options)
    
    //check if another sprite has already loaded the requested url
    this.uniqueSprite = true; //start out assuming the sprite is unique until check is performed
    for(let i = 0; i < Sprite.spriteRegistration.length; ++i)
    {
        if(Sprite.spriteRegistration[i].url === url)
        {
            if(options.debugLogCreation) console.log("Sprite created with existing image");
            this.image = Sprite.spriteRegistration[i].image;
            this.uniqueSprite = false;
            break;
        }
    }

    //get the image object
    if(!this.image)
    {
        if(options.debugLogCreation) console.log("Sprite created with new image")
        this.image = new Image();
        this.image.src = url;
    }

    //set the frame dimensions
    this.frameW = frameW;
    this.frameH = frameH;

    //set the frame table parameters
    this.cols = columns;
    this.rows = rows;

    //save the url string
    this.url = url;

    //set frame data
    this.endFrame = rows * columns - 1; //default can be overwritten in frame options
    this.startFrame = 0; //by default frame will start at 0

    //default methods
    //all default methods can be overwritten for additional functionality
    this.render = function(game, x, y, scale = 1) { Sprite.render(this, game, x, y, scale); };
    
    this.nextFrame = function()
    {
        //advance the frame foreward one
        this.frame++;
        
        //if the frame advanced past the end frame, loop it
        if(this.frame > this.endFrame) this.frame = this.startFrame;
    };
    this.prevFrame = function()
    {
        //advance the frame back one
        this.frame--;
        
        //if the frame advanced past the start frame, loop it
        if(this.frame < this.startFrame) this.frame = this.endFrame;
    }

    //check for/set optional parameters
    if(options.endFrame) this.endFrame = options.endFrame;
    if(options.startFrame) this.startFrame = options.startFrame;
    if(typeof options.render === "function") this.render = options.render;
    if(typeof options.nextFrame === "function") this.nextFrame = option.nextFrame; // I litterally can't think of a reason to override this, but the option is there
    if(typeof options.prevFrame === "function") this.prevFrame = option.prevFrame; // I litterally can't think of a reason to override this, but the option is there

    //set the current frame
    this.frame = this.startFrame;

    //register the sprite if it is unique
    //this cuts down on the number of elements to search when looking for shared sprite images.
    if(this.uniqueSprite)
        Sprite.spriteRegistration.push(this);
}

