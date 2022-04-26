const UP = 111;
const DOWN = 112;
const LEFT = 113;
const RIGHT = 114;
const START_TIME = new Date();
var SnakeGame;
var snake;

function restart(e)
{
    $('#howPlayInstructions').addClass("hidden");
    $('#scoreboard').removeClass("hidden");

    SnakeGame = new CreateGameMaster("nokiaEmulator9001");
    SnakeGame.timeTracker = START_TIME.getSeconds();
    SnakeGame.frameTracker = SnakeGame.framesCount;
    SnakeGame.actualFramerate = 0;
    SnakeGame.showFramerate = false;
    SnakeGame.drawOverlay = function() 
    {
        var d = new Date();
        if(this.timeTracker !== d.getSeconds())
        {
            this.timeTracker = d.getSeconds();
            this.actualFramerate = this.framesCount - this.frameTracker;
            this.frameTracker = this.framesCount;
        }
        let output = "";
        if(this.showFramerate) output += "framerate: " + this.actualFramerate;
        
        this.pen.font = "30px computerPixel";
        this.pen.fillStyle = "white";
        this.pen.textAlign = "left";
        this.pen.fillText(output, 5, 30);

        document.getElementById("score").innerText = snake.score;

        if(snake.levelUpOverlay)
        {
            if(this.framesCount > snake.levelUpOverlayEnd)
                snake.levelUpOverlay = false;
            
            
            this.pen.font = "60px outrunFuture";
            this.pen.fillStyle = "DarkGreen";
            this.pen.textAlign = "center";
            this.pen.fillText("Level Up!", this.paper.width/2, this.paper.height/2);
            this.pen.fillStyle = "Lime";
            this.pen.lineWidth = 3;
            this.pen.strokeText("Level Up!", this.paper.width/2, this.paper.height/2);
            
        }
    }
    SnakeGame.init({width:500, height:350, backgroundColor:"DarkSlateGray"});

    //snake segment
    function SnakeSegment(x, y)
    { 
        this.foregroundObject = new GameFGObject(SnakeGame, x, y, 25, 25, { 
            type:"snakeSegment",
            drawFrame: function() //override the render method to display the sprite
            {
                this.sprite.render(SnakeGame, this.x, this.y);

                //draw transparent circle over top to shade
                SnakeGame.pen.beginPath();
                SnakeGame.pen.arc(this.x+this.width/2, this.y+this.height/2, this.width/2 ,0,Math.PI*2,true);
                SnakeGame.pen.fillStyle = "darkGreen";
                SnakeGame.pen.globalAlpha = 0.5;
                SnakeGame.pen.fill();
                SnakeGame.pen.closePath();
                SnakeGame.pen.globalAlpha = 1;
            } 
        });
        this.foregroundObject.sprite = new GameSprite("./media/snake-segment.png", 25, 25, 3, 3, 
        {
            startFrame:2, 
            endFrame:3,
        });
        this.x = x;
        this.y = y;
    }

    //snake
    snake = new GameFGObject(SnakeGame, 0,0,10,10, {drawFrame:function() { return; }}); //only used to handle updating the snake object.
                                                                                            //the render function has been overridden to
                                                                                            //avoid any attempts to render this object

    //create the snake head segment, this is the piece directly controlled by the player. All other segments will follow the head in order.
    snake.head =  new SnakeSegment(275,175);
    snake.head.foregroundObject.type = "snakeHead";

    snake.segments = [new SnakeSegment(250,175), new SnakeSegment(225,175)];
    snake.directionX = 1;
    snake.directionY = 0;
    snake.framesRendered = 0;
    snake.animationRate = 30;
    snake.moveRate = 20;
    snake.maxLevel = 9;
    snake.level = 0;
    snake.levelUpOverlay = false;
    snake.levelUpOverlayDecay = 46; // how long the levelup overlay stays on the screen
    snake.levelUpOverlayEnd = 0;
    snake.inputQueue = [];
    snake.score = 0;
    snake.updateFrame = function()
    {
        //hanlde animation
        if(this.framesRendered % this.animationRate === 0)
        {
            this.head.foregroundObject.sprite.nextFrame();
        }

        for (let i = 0; i < this.segments.length; ++i)
        {
            if(i%2 === 0)
            {
                if(this.segments[i].foregroundObject.sprite.frame === this.head.foregroundObject.sprite.frame) this.segments[i].foregroundObject.sprite.nextFrame();
            }
            else this.segments[i].foregroundObject.sprite.frame = this.head.foregroundObject.sprite.frame;
        }

        //move the snake and tail according to the current direction
        if(this.framesRendered % this.moveRate === 0)
        {  
            if(snake.inputQueue[0])
            {
                //drop any inputs beyond the most recent 2
                while(snake.inputQueue.length > 2)
                {
                    snake.inputQueue.pop();
                }
                
                if(snake.inputQueue[0] === UP)
                {
                    snake.directionX = 0;
                    if(snake.directionY === 0) snake.directionY = -1;
                }
                else if(snake.inputQueue[0] === DOWN)
                {
                    snake.directionX = 0;
                    if(snake.directionY === 0) snake.directionY = 1;
                }
                else if(snake.inputQueue[0] === RIGHT)
                {
                    if(snake.directionX === 0) snake.directionX = 1;
                    snake.directionY = 0;
                }
                else if(snake.inputQueue[0] === LEFT)
                {
                    if(snake.directionX === 0) snake.directionX = -1;
                    snake.directionY = 0;
                }

                snake.inputQueue.shift();
            }

            var prevLocX = this.head.foregroundObject.x;
            var prevLocY = this.head.foregroundObject.y;
            if(this.directionX > 0)
            {
                //move head
                this.head.foregroundObject.x+=25;
            }
            else if(this.directionX < 0)
            {
                //move head
                this.head.foregroundObject.x-=25;
            }
            else if(this.directionY > 0)
            {
                //move head
                this.head.foregroundObject.y+=25;
            }
            else if(this.directionY < 0)
            {
                //move head
                this.head.foregroundObject.y-=25;
            }

            //move tail
            for(let i = 0; i < this.segments.length; ++i)
            {
                var tmpX = this.segments[i].foregroundObject.x;
                var tmpY = this.segments[i].foregroundObject.y;

                this.segments[i].foregroundObject.x = prevLocX;
                this.segments[i].foregroundObject.y = prevLocY;

                prevLocX = tmpX;
                prevLocY = tmpY;
            }
        }
        
        //check collisions
        var inBounds = false;
        var hitTail = false;
        for (let i = 0; i < this.head.foregroundObject.overlapObjects.length; ++i)
        {
            if (this.head.foregroundObject.overlapObjects[i].type === "gameArea") 
                inBounds = true;
            if (this.head.foregroundObject.overlapObjects[i].type === "snakeSegment")
                hitTail = true;
            if (this.head.foregroundObject.overlapObjects[i].type === "cookie")
            {
                //store the cookie in a local variable to make working with it easier
                let cookie = this.head.foregroundObject.overlapObjects[i];
            
                //check if lil Mr. Piggy already ate this cookie...
                //this is an unfortunate side effect of how this game processes movement
                //the snake continues to overlap the cookie until the next time the head moves
                if(cookie.namNam)
                    continue; //NO COOKIE FOR YOU!!!!!!!

                //cookie make grow big and strong... Protein cookies? ¯\_(ツ)_/¯
                for (let j = 0; j < cookie.cookieType.value; ++j)
                {
                    this.segments.push(new SnakeSegment(-50,-50));
                }

                //snake namNam cookie???
                cookie.namNam = true;

                //add points to score
                this.score += cookie.cookieType.value * 10;
            }
        }
        if((!inBounds || hitTail) && SnakeGame.framesCount > 100) 
        {
            console.info(this);
            gameOver();
        }
        
        //check for level up every 100pts
        if(this.level !== Math.floor(this.score / 100) && this.level !== this.maxLevel)
        {
            //begin level up
            this.levelUpOverlay = true;
            this.level++;
            this.levelUpOverlayEnd = SnakeGame.framesCount + this.levelUpOverlayDecay;
            this.moveRate--;
        }
        

        //keep track of the number of frames rendered for timing events. The main game loop runs at 60fps, but 
        //animations and movement only happen every x # of frames.
        this.framesRendered++;    
    }

    var gameArea = new GameFGObject(SnakeGame, 0,0, SnakeGame.paper.width, SnakeGame.paper.height, {
        drawFrame: function(){return;},
        type: "gameArea"
    });


    /******************************************************************************************
     * Cookies and CookieJar (food and food item)
    ******************************************************************************************/
    function GenerateCookieType()
    {
        let r = Math.random();
        if(r <= 0.7)
        {
            this.value = 1;
            this.decay = SnakeGame.framerate * 15;
        }
        else if(!this.value && r <= 0.9)
        {
            this.value = 2;
            this.decay = SnakeGame.framerate * 6;
        }
        else
        {
            this.value = 3;
            this.decay = SnakeGame.framerate * 4;
        }

        this.firstFrame = SnakeGame.framesCount;
    }
    function Cookie()
    {
        //get new coords 
        var x = Math.random() * SnakeGame.paper.width
        var y = Math.random() * SnakeGame.paper.height

        //line them up to the grid
        x -= x % 25;
        y -= y % 25;

        this.foregroundObject = new GameFGObject(SnakeGame, x, y, 25, 25, {
            type:"cookie",
            drawFrame: function()
            {
                this.sprite.render(SnakeGame, this.x, this.y);
            }
        });
        this.foregroundObject.sprite = new GameSprite("./media/snake-segment.png", 25, 25, 3, 3, 
        {
            startFrame:6,
            endFrame:6
        });
        this.foregroundObject.animationRate = 10;
        this.foregroundObject.cookieType = new GenerateCookieType();
        this.foregroundObject.namNam = false;

        //set color
        switch(this.foregroundObject.cookieType.value)
        {
            case 2:
                this.foregroundObject.sprite.frame = 7;
                break;
            case 3:
                this.foregroundObject.sprite.frame = 8;
                break;
        }
    }

    var CookieJar = new GameFGObject(SnakeGame, 0,0,0,0,
        {
            drawFrame: function(){return;}, //non-drawable object
            updateFrame: function()
            {
                console.log("entityCount: " + SnakeGame.gameForegroundObjects.length)
                //throw out expired cookies
                for (let i = 0; i < this.contents.length; ++i)
                {
                    if(this.contents[i].foregroundObject.cookieType.decay + this.contents[i].foregroundObject.cookieType.firstFrame < SnakeGame.framesCount)
                    {
                        this.contents[i].foregroundObject.remove();       
                        this.contents.splice(i, 1); //remove dried up cookie from the jar

                        //prevent loop from ending up out of array bounds
                        --i;
                        if(i<0) i = 0;
                    }
                    for(let j = 0; j < this.contents[i].foregroundObject.overlapObjects.length; ++j)
                        if(this.contents[i].foregroundObject.overlapObjects[j].type === "snakeSegment") 
                        {
                            this.contents[i].foregroundObject.remove();    
                            this.contents.splice(i, 1); //remove cookie from under snake's belly
                        
                            //prevent loop from ending up out of array bounds
                            --i;
                            if(i<0) i = 0;
                        }
                    if(this.contents[i].foregroundObject.namNam)
                    {
                        this.contents[i].foregroundObject.remove();    
                        this.contents.splice(i, 1); //remove cookie from under snake's belly
                    
                        //prevent loop from ending up out of array bounds
                        --i;
                        if(i<0) i = 0;                    
                    }
                }

                //refill the cookie jar
                while (this.contents.length < this.totalCookies)
                {
                    this.contents.push(new Cookie());
                }
            }
        });
    CookieJar.contents = new Array();
    CookieJar.totalCookies = 3;
}

document.getElementById("start").addEventListener("click", restart);

window.addEventListener("keydown", function(e)
{
    if(e.key == "ArrowUp")
    {
        snake.inputQueue.push(UP);
    }
    else if(e.key == "ArrowDown")
    {
        snake.inputQueue.push(DOWN);
    }
    else if(e.key == "ArrowRight")
    {
        snake.inputQueue.push(RIGHT);
    }
    else if(e.key == "ArrowLeft")
    {
        snake.inputQueue.push(LEFT);
    }
});

function gameOver()
{
    $('#howPlayInstructions').removeClass("hidden");
    $('#scoreboard').addClass("hidden");
    window.clearInterval(SnakeGame.interval);
    window.setTimeout(function()
    {
        SnakeGame.pen.font = "60px outrunFuture";
        SnakeGame.pen.fillStyle = "DarkRed";
        SnakeGame.pen.textAlign = "center";
        SnakeGame.pen.fillText("Game Over", SnakeGame.paper.width/2, SnakeGame.paper.height/2);
        SnakeGame.pen.fillStyle = "Black";
        SnakeGame.pen.lineWidth = 3;
        SnakeGame.pen.strokeText("Game Over", SnakeGame.paper.width/2, SnakeGame.paper.height/2);
    }, 600);
}
