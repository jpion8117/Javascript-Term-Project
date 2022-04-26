var blockGame;
var prevBlock;
var blockInPlay;
var nextBlock;
var tron;

//One single piece of a T****s (Nin-10-Doe is VERY litigious) block
class BlockPiece extends GameFGObject
{   
    sprite = null;
    visible = false;
    outOfFrame = false;
    moveTest = false;
    demo = false;
    padding = 2;
    backColor = "Black";
    backPadding = 2;

    constructor(game, x, y, options = {type:"blockPiece"})
    {
        options.drawFrame = function()
        {
            //skip drawing if block is not visible
            if(!this.visible || this.outOfFrame || this.moveTest) 
                return;

            //add special "locked in" effect to dead blocks (adds frame around shrunken block)
            if(this.type === "deadBlockPiece")
            {
                this.GameObject.pen.fillStyle = this.backColor;
                this.GameObject.pen.fillRect(this.x+this.backPadding, this.y+this.backPadding, this.width-(this.backPadding*2), this.height-(this.backPadding*2));
            }

            //draw the block    
            this.GameObject.pen.fillStyle = this.color;
            this.GameObject.pen.fillRect(this.x+this.padding, this.y+this.padding, this.width-(this.padding*2), this.height-(this.padding*2));
            
            //add special "locked in" effect to dead blocks (dims color)
            if(this.type === "deadBlockPiece")
            {
                this.GameObject.pen.globalAlpha = 0.2;
                this.GameObject.pen.fillStyle = "black";
                this.GameObject.pen.fillRect(this.x+this.backPadding, this.y+this.backPadding, this.width-(this.backPadding*2), this.height-(this.backPadding*2));
                this.GameObject.pen.globalAlpha = 1;
            }

            if (typeof this.postDrawFrame === "function") this.postDrawFrame();
        }
        options.updateFrame = function()
        {
            //dont process any piece that's not visible or is already "dead"
            if(!this.visible || this.outOfFrame)
                return;

            //check if block piece is in grid
            this.outOfFrame = true;
            for (let i = 0; i < this.overlapObjects.length; ++i)
            {
                if (this.overlapObjects[i].type === "gameGrid")
                {
                    this.outOfFrame = false;
                    return;
                }
            }
        }

        super(game, x, y, 40, 40, options);

        if(options.sprite) this.sprite = options.sprite;
        if(options.visible) this.visible = options.visible;
        if(options.moveTest) this.moveTest = options.moveTest;
        if(options.padding) this.padding = options.padding;
    }
}

class LineChecker extends GameFGObject
{
    findLocation()
    {
        this.y = 160 + (40 * this.index);
    }

    deadBlocks = [];
    index;

    constructor(index = -1)
    {
        super(blockGame, 40, -40, 400, 40, {
            drawFrame: function(){},
            updateFrame: function()
            {
                for(let i = 0; i < this.deadBlocks.length; ++i)
                {
                    this.deadBlocks[i].y = this.y;
                }
            },
            type:"lineChecker"
        });
        this.index = index;
    }
}

//Defines the game board
//takes block pieces from compound block when contact is made
class GameGrid extends GameFGObject
{
    static BASE_POINTS_1_LINE = 20;
    static BASE_POINTS_2_LINES = 50;
    static BASE_POINTS_3_LINES = 150;
    static BASE_POINTS_4_LINES = 600;
    static NUM_OF_LINES = 16;
    lineCheckers = [];
    gridBlocks = [];
    dropLZ = new GameFGObject(blockGame, 200, 40, 40, 40, 
        {
            drawFrame:function(){},
            updateFrame: function()
            {
                for(let i = 0; i < this.overlapObjects.length; ++i)
                {
                    if(this.overlapObjects[i].type === "deadBlockPiece")
                    {
                        GameOver();
                    }
                }
            }
        });

    reindexLineCheckers()
    {
        //put them in order from lowest to highest
        this.lineCheckers.sort(function(a,b) { return a.index - b.index; } ) //sort by index

        //reindex to new locations
        for(let i = 0; i < this.lineCheckers.length; ++i)
        {
            this.lineCheckers[i].index = i;
            this.lineCheckers[i].findLocation();
        }
    }

    constructor()
    {
        super(blockGame, 40, 40, 400, 640,{
            type:"gameGrid",
            drawFrame: function(){},
            updateFrame: function()
            {
                var adjustedFallrate = blockGame.fallRate;
                if(blockInPlay.accelerated) 
                {
                    adjustedFallrate = adjustedFallrate * 0.05;
                    blockInPlay.accelerated = false;
                }
                if(blockGame.framesCount % adjustedFallrate === 0)
                {
                    //use a move test to determine if the next move is valid
                    var testBlock = new MoveTest(blockInPlay, 40);
                    if(testBlock.validMove)//indicates block can move down
                    {
                        prevBlock = blockInPlay;
                        prevBlock.remove();
                        blockInPlay = CompoundBlock.RegenBlock(blockInPlay, testBlock.x, testBlock.y);
                        blockInPlay.updateActive();
                    }
                    else //block can't move down and needs to be locked
                    {
                        for(let i = 0; i < blockInPlay.allBlocks[blockInPlay.activeBlock].length; ++i)
                        {
                            var block = blockInPlay.allBlocks[blockInPlay.activeBlock][i]; //local var makes working with it easier

                            this.gridBlocks.push(new BlockPiece(blockGame, block.x, block.y, 
                                {
                                    color:block.color,
                                    padding:6,
                                    type:"deadBlockPiece",
                                    visible:true
                                }));
                        }
                        prevBlock = blockInPlay;
                        prevBlock.remove();
                        blockInPlay = CompoundBlock.RegenBlock(nextBlock, 200, 40); 
                        nextBlock = CompoundBlock.generateNewBlock(blockInPlay, 200, -100);

                        //display next piece
                        var nextBlockHTML = "";
                        nextBlockHTML += "<h2>Next Piece</h2><br>"
                        nextBlockHTML += "<img src=\"media/"+nextBlock.type+".png\">"
                        document.getElementById("nextPiece").innerHTML = nextBlockHTML;
                    }
                }
                //check if any lines are complete
                var clearedLines = []; //contains an array of lineCheckers that have complete lines
                for (let i = 0; i < this.lineCheckers.length; ++i)
                {
                    var deadBlocks = []; //contains an array of all dead blocks in this line
                    //find all dead blocks in this line
                    for (let j = 0; j < this.lineCheckers[i].overlapObjects.length; ++j)
                    {
                        if (this.lineCheckers[i].overlapObjects[j].type === "deadBlockPiece")
                            deadBlocks.push(this.lineCheckers[i].overlapObjects[j]);
                    }

                    //register dead blocks with lineChecker
                    this.lineCheckers[i].deadBlocks = deadBlocks;

                    //remove cleared line blocks
                    if (deadBlocks.length === 10)
                    {
                        clearedLines.push(this.lineCheckers[i]);
                        this.lineCheckers[i] = new LineChecker(); //replace line checker with a new fresh one
                        for (let j = 0; j < deadBlocks.length; ++j)
                            deadBlocks[j].remove();
                    }
                }

                //award points
                switch(clearedLines.length)
                {
                    case 1:
                        blockGame.score += GameGrid.BASE_POINTS_1_LINE * blockGame.level;
                        break;
                    case 2:
                        blockGame.score += GameGrid.BASE_POINTS_2_LINES * blockGame.level;
                        break;
                    case 3:
                        blockGame.score += GameGrid.BASE_POINTS_3_LINES * blockGame.level;
                        break;
                    case 4:
                        blockGame.score += GameGrid.BASE_POINTS_4_LINES * blockGame.level;
                        break;
                }

                if(clearedLines.length > 0)
                {
                    document.getElementById("score").innerText = "Score: " + blockGame.score;
                }

                //delete cleared lines
                for (let i = 0; i < clearedLines.length; ++i)
                {
                    clearedLines[i].remove(); //removes this line checker
                }
                
                //rearrange the lines
                this.reindexLineCheckers();
            }
        });

        //define the line checkers
        for(let i = 0; i < GameGrid.NUM_OF_LINES; ++i)
        {
            this.lineCheckers.push(new LineChecker(i));
        }
    }
}

//Base class for all compound blocks or T****s blocks as they are called
class CompoundBlock extends GameFGObject
{
    activeBlock = 0;
    allBlocks = [];
    accelerated = false;

    static generateNewBlock(lastBlock, x = 200, y = 40)
    {
        var lastBlockType = "";
        var temp = { type:"" };
        if(lastBlock)
        {
            temp = lastBlock;
            lastBlockType = lastBlock.type; 
        }

        while(temp.type === lastBlockType) //keeps the same block from generating 2x
        {
            switch(Math.floor(Math.random() * 5))
            {
                case 0:
                    temp = new LLBlock(blockGame, x, y, {color:"green"});
                    break;
                case 1:
                    temp = new LRBlock(blockGame, x, y, {color:"SaddleBrown"});
                    break;
                case 2:
                    temp = new TBlock(blockGame, x, y, {color:"yellow"});
                    break;
                case 3:
                    temp = new LineBlock(blockGame, x, y, {color:"red"});
                    break;
                case 4:
                    temp = new SquareBlock(blockGame, x, y, {color:"orange"});
                    break;
            }
        }

        if(lastBlock && typeof lastBlock.remove === "function") lastBlock.remove();//ensures last block is always marked for death

        return temp;
    }

    static RegenBlock(original, x, y)
    { 
        var temp;
        var options = 
        { 
            activeBlock:original.activeBlock, 
            color:original.color,
            accelerated:original.accelerated
        };
                            
        switch(original.type)
        {
            case "LLBlock":
                temp = new LLBlock(blockGame, x, y, options);
                break;
            case "LRBlock":
                temp = new LRBlock(blockGame, x, y, options);
                break;
            case "TBlock":
                temp = new TBlock(blockGame, x, y, options);
                break;
            case "LineBlock":
                temp = new LineBlock(blockGame, x, y, options);
                break;
            case "SquareBlock":
                temp = new SquareBlock(blockGame, x, y, options);
                break;
        }

        return temp;
    }

    rotateRight()
    {
        //hide all blocks
        for(let i = 0; i < this.allBlocks[this.activeBlock].length; ++i)
        {
            this.allBlocks[this.activeBlock][i].visible = false;
        }

        //get index of next activeBlock
        var nextActive = this.activeBlock + 1;
        if(nextActive >= this.allBlocks.length) 
            nextActive = 0;

        //check if next position is clear
        var pathClear = true;
        for (let i = 0; i < this.allBlocks[nextActive].length; ++i)
        {
            var pieceInBounds = false;
            for (let j = 0; j < this.allBlocks[nextActive][i].overlapObjects.length; ++j)
            {
                if (this.allBlocks[nextActive][i].overlapObjects[j].type === "deadBlockPiece")
                {
                    pathClear = false;
                }
                else if (this.allBlocks[nextActive][i].overlapObjects[j].type === "gameGrid")
                {
                    pieceInBounds = true;
                }
            }

            if (!pieceInBounds)
                pathClear = false;
            if(!pathClear)
                break;
        }

        //change active block
        if (pathClear)
            this.activeBlock = nextActive;
        
        //make active block visible
        for(let i = 0; i < this.allBlocks[this.activeBlock].length; ++i)
        {
            this.allBlocks[this.activeBlock][i].visible = true;
        }
    }
    
    rotateLeft()
    {
        //hide all blocks
        for(let i = 0; i < this.allBlocks[this.activeBlock].length; ++i)
        {
            this.allBlocks[this.activeBlock][i].visible = false;
        }

        //get index of next activeBlock
        var nextActive = this.activeBlock - 1;
        if(nextActive < 0) 
            nextActive = this.allBlocks.length - 1;

        //check if next position is clear
        var pathClear = true;
        for (let i = 0; i < this.allBlocks[nextActive].length; ++i)
        {
            var pieceInBounds = false;
            for (let j = 0; j < this.allBlocks[nextActive][i].overlapObjects.length; ++j)
            {
                if (this.allBlocks[nextActive][i].overlapObjects[j].type === "deadBlockPiece")
                {
                    pathClear = false;
                    break;
                }
                if (this.allBlocks[nextActive][i].overlapObjects[j].type === "gameGrid")
                {
                    pieceInBounds = true;
                }
            }
            if (!pieceInBounds)
                pathClear = false;
            if(!pathClear)
                break;
        }

        //change active block
        if (pathClear)
            this.activeBlock = nextActive;
        
        //make active block visible
        for(let i = 0; i < this.allBlocks[this.activeBlock].length; ++i)
        {
            this.allBlocks[this.activeBlock][i].visible = true;
        }
    }
    updateActive()
    {
        //hide all blocks
        for (let i = 0; i < this.allBlocks.length; ++i)
        {
            for(let j = 0; j < this.allBlocks[i].length; ++j)
            {
                this.allBlocks[i][j].visible = false;
            }
        }

        //make active block visible
        for(let i = 0; i < this.allBlocks[this.activeBlock].length; ++i)
        {
            this.allBlocks[this.activeBlock][i].visible = true;
        }
    }

    constructor(game, x, y, options = {})
    {
        super(game, x, y, 0, 0, options);

        if(options.activeBlock) this.activeBlock = options.activeBlock;
        if(options.accelerated) this.accelerated = options.accelerated;

        this.remove = function()
        {
            for(let i = 0; i < this.allBlocks.length; ++i)
            {
                for (let j = 0; j < this.allBlocks[i].length; ++j)
                {
                    this.allBlocks[i][j].remove();
                }
            }
    
            this.markForRemoval = true;
        }
    }
}

class MoveTest extends CompoundBlock
{
    validMove = true;

    constructor(testBlock, checkDistance = 40, direction = "down")
    {
        var xChg = 0;
        var yChg = 0;

        switch(direction.toLowerCase())
        {
            case "left":
                xChg = -checkDistance;
                break;
            case "right":
                xChg = checkDistance;
                break;
            default:
                yChg = checkDistance;
                break;
        }

        super(testBlock.GameObject, testBlock.x+xChg, testBlock.y+yChg)

        var active = testBlock.allBlocks[testBlock.activeBlock]; //get the currently active block array
        for(let i = 0; i < active.length; ++i)
        {
            var testPiece = new BlockPiece(active[i].GameObject, active[i].x+xChg,active[i].y+yChg); //create a new testPiece
            testPiece.moveTest = true; //define them as move test pieces
            testPiece.checkCollisions(testPiece.GameObject); //check the collisions of the new blockPieces
            
            //check if the move was valid
            var inFrame = false;
            for (let j = 0; j < testPiece.overlapObjects.length; ++j)
            {
                if(testPiece.overlapObjects[j].type === "deadBlockPiece")
                {
                    this.validMove = false;
                }
                if (testPiece.overlapObjects[j].type === "gameGrid")
                {
                    inFrame = true;
                }
            }
            testPiece.remove(); //mark piece for removal
            if(!inFrame) this.validMove = false; //if move is out of frame it's marked as false
            if(!this.validMove) break; //no need to keep checking if move is invalidated
        }

        this.remove() //not 100% sure if this will work but YOLO... UPDATE: it did, I'm a flaughles human begining
    }
}

class LLBlock extends CompoundBlock
{
    constructor(game, x, y, options = {})
    {
        options.type = "LLBlock";
        
        super(game, x, y, options);

        //initial rotation
        var shape = [];
        shape.push(new BlockPiece(game, x, y, {visible:true}));
        shape.push(new BlockPiece(game, x-40, y, {visible:true}));
        shape.push(new BlockPiece(game, x+40, y, {visible:true}));
        shape.push(new BlockPiece(game, x-40, y+40, {visible:true}));
        this.allBlocks.push(shape);

        //first rotation
        var shape = [];      
        shape.push(new BlockPiece(game, x, y));
        shape.push(new BlockPiece(game, x, y-40));
        shape.push(new BlockPiece(game, x, y+40));
        shape.push(new BlockPiece(game, x-40, y-40));
        this.allBlocks.push(shape);

        //second rotation
        var shape = [];
        shape.push(new BlockPiece(game, x, y));
        shape.push(new BlockPiece(game, x-40, y));
        shape.push(new BlockPiece(game, x+40, y));
        shape.push(new BlockPiece(game, x+40, y-40));
        this.allBlocks.push(shape);

        //last rotation
        var shape = [];
        shape.push(new BlockPiece(game, x, y));
        shape.push(new BlockPiece(game, x, y-40));
        shape.push(new BlockPiece(game, x, y+40));
        shape.push(new BlockPiece(game, x+40, y+40));
        this.allBlocks.push(shape);

        for (let i = 0; i < this.allBlocks.length; ++i)
        {
            for(let j = 0; j < this.allBlocks[i].length; ++j)
            {
                this.allBlocks[i][j].color = this.color;
            }
        }
    }
}

class LRBlock extends CompoundBlock
{
    constructor(game, x, y, options = {})
    {
        options.type = "LRBlock";
        
        super(game, x, y, options)

        //initial rotation
        var shape = [];
        shape.push(new BlockPiece(game, x, y, {visible:true}));
        shape.push(new BlockPiece(game, x-40, y, {visible:true}));
        shape.push(new BlockPiece(game, x+40, y, {visible:true}));
        shape.push(new BlockPiece(game, x+40, y+40, {visible:true}));
        this.allBlocks.push(shape);

        //first rotation
        var shape = [];      
        shape.push(new BlockPiece(game, x, y));
        shape.push(new BlockPiece(game, x, y-40));
        shape.push(new BlockPiece(game, x, y+40));
        shape.push(new BlockPiece(game, x-40, y+40));
        this.allBlocks.push(shape);

        //second rotation
        var shape = [];
        shape.push(new BlockPiece(game, x, y));
        shape.push(new BlockPiece(game, x-40, y));
        shape.push(new BlockPiece(game, x+40, y));
        shape.push(new BlockPiece(game, x-40, y-40));
        this.allBlocks.push(shape);

        //last rotation
        var shape = [];
        shape.push(new BlockPiece(game, x, y));
        shape.push(new BlockPiece(game, x, y-40));
        shape.push(new BlockPiece(game, x, y+40));
        shape.push(new BlockPiece(game, x+40, y-40));
        this.allBlocks.push(shape);

        for (let i = 0; i < this.allBlocks.length; ++i)
        {
            for(let j = 0; j < this.allBlocks[i].length; ++j)
            {
                this.allBlocks[i][j].color = this.color;
            }
        }
    }
}

class SquareBlock extends CompoundBlock
{
    //square blocks don't rotate
    rotateLeft() {}
    rotateRight() {}

    constructor(game, x, y, options = {})
    {
        options.type = "SquareBlock";
        
        super(game, x, y, options);
        
        var shape = [];
        shape.push(new BlockPiece(game, x, y, {visible:true}));
        shape.push(new BlockPiece(game, x, y-40, {visible:true}));
        shape.push(new BlockPiece(game, x+40, y, {visible:true}));
        shape.push(new BlockPiece(game, x+40, y-40, {visible:true}));
        this.allBlocks.push(shape);

        for (let i = 0; i < this.allBlocks.length; ++i)
        {
            for(let j = 0; j < this.allBlocks[i].length; ++j)
            {
                this.allBlocks[i][j].color = this.color;
            }
        }
    }
}

class TBlock extends CompoundBlock
{
    constructor(game, x, y, options = {})
    {
        options.type = "TBlock";

        super(game, x, y, options)

        //initial rotation
        var shape = [];
        shape.push(new BlockPiece(game, x, y, {visible:true}));
        shape.push(new BlockPiece(game, x-40, y, {visible:true}));
        shape.push(new BlockPiece(game, x+40, y, {visible:true}));
        shape.push(new BlockPiece(game, x, y-40, {visible:true}));
        this.allBlocks.push(shape);

        //first rotation
        var shape = [];      
        shape.push(new BlockPiece(game, x, y));
        shape.push(new BlockPiece(game, x, y-40));
        shape.push(new BlockPiece(game, x, y+40));
        shape.push(new BlockPiece(game, x+40, y));
        this.allBlocks.push(shape);

        //second rotation
        var shape = [];
        shape.push(new BlockPiece(game, x, y));
        shape.push(new BlockPiece(game, x-40, y));
        shape.push(new BlockPiece(game, x+40, y));
        shape.push(new BlockPiece(game, x, y+40));
        this.allBlocks.push(shape);

        //last rotation
        var shape = [];
        shape.push(new BlockPiece(game, x, y));
        shape.push(new BlockPiece(game, x, y-40));
        shape.push(new BlockPiece(game, x, y+40));
        shape.push(new BlockPiece(game, x-40, y));
        this.allBlocks.push(shape);

        for (let i = 0; i < this.allBlocks.length; ++i)
        {
            for(let j = 0; j < this.allBlocks[i].length; ++j)
            {
                this.allBlocks[i][j].color = this.color;
            }
        }
    }    
}

class LineBlock extends CompoundBlock
{
    constructor(game, x, y, options = {})
    {
        options.type = "LineBlock";
        
        super(game, x, y, options)

        //initial rotation
        var shape = [];
        shape.push(new BlockPiece(game, x, y, {visible:true}));
        shape.push(new BlockPiece(game, x-40, y, {visible:true}));
        shape.push(new BlockPiece(game, x-80, y, {visible:true}));
        shape.push(new BlockPiece(game, x+40, y, {visible:true}));
        this.allBlocks.push(shape);

        //other rotation
        var shape = [];      
        shape.push(new BlockPiece(game, x, y));
        shape.push(new BlockPiece(game, x, y-40));
        shape.push(new BlockPiece(game, x, y-80));
        shape.push(new BlockPiece(game, x, y+40));
        this.allBlocks.push(shape);

        for (let i = 0; i < this.allBlocks.length; ++i)
        {
            for(let j = 0; j < this.allBlocks[i].length; ++j)
            {
                this.allBlocks[i][j].color = this.color;
            }
        }
    }    
}

//control event listeners
document.getElementById("start").addEventListener('click', Start);
window.addEventListener('keydown', function(e)
{    
    if(e.key === "x") blockInPlay.rotateRight();
    else if(e.key === "z") blockInPlay.rotateLeft();
    else if(e.key === "ArrowRight")
    {
        var testBlock = new MoveTest(blockInPlay, 40, "right");
        if(testBlock.validMove)
        {
            prevBlock = blockInPlay;
            prevBlock.remove();
            blockInPlay = CompoundBlock.RegenBlock(blockInPlay, testBlock.x, testBlock.y);
            blockInPlay.updateActive();
        }
    }
    else if(e.key === "ArrowLeft")
    {
        var testBlock = new MoveTest(blockInPlay, 40, "left");
        if(testBlock.validMove)
        {
            prevBlock = blockInPlay;
            prevBlock.remove();
            blockInPlay = CompoundBlock.RegenBlock(blockInPlay, testBlock.x, testBlock.y);
            blockInPlay.updateActive();
        }
    }
    else if(e.key === "ArrowDown") 
    {
        blockInPlay.accelerated = true;
    }
});

function Start()
{
    $('#IDontHaveTheTimeForThis').removeClass('hidden');
    $('#howPlay').addClass('hidden');

    document.getElementById("score").innerText = "Score: 0";

    blockGame = new CreateGameMaster("genericFallingBlockPuzzleGame");
        blockGame.score = 0;
        blockGame.celebrate = false;
        blockGame.fallRate = 35;
        blockGame.level = 1;
    backgroundTexture = new GameBGObject(blockGame, 0, 0, blockGame.paper.width, blockGame.paper.height,
        {
            drawFrame: function()
            {
                this.sprite.render(blockGame, 0, 0);
            }
        });
        backgroundTexture.sprite = new GameSprite("media/blockBack.png",480,720,1,1);
    backgroundColorMask = new GameBGObject(blockGame, 0, 0, blockGame.paper.width, blockGame.paper.height,
        {
            color:"DarkSlateBlue",
            drawFrame: function()
            {
                this.GameObject.pen.globalAlpha = 0.6;
                this.GameObject.pen.fillStyle = this.color;
                this.GameObject.pen.fillRect(this.x, this.y, this.width, this.height);
                this.GameObject.pen.globalAlpha = 1;
            }
        });
    blockGame.init();

    blockInPlay = CompoundBlock.generateNewBlock();
    nextBlock = CompoundBlock.generateNewBlock(null, 200, -100);
    prevBlock = null;
    tron = new GameGrid(); //you know... because it's "the grid"... lol
    
    //display next piece
    var nextBlockHTML = "";
    nextBlockHTML += "<h2>Next Piece</h2><br>"
    nextBlockHTML += "<img src=\"media/"+nextBlock.type+".png\">"
    document.getElementById("nextPiece").innerHTML = nextBlockHTML;
}

function GameOver()
{
    $('#IDontHaveTheTimeForThis').addClass('hidden');
    $('#howPlay').removeClass('hidden');
    window.clearInterval(blockGame.interval);
    window.setTimeout(function()
    {
        blockGame.pen.font = "60px outrunFuture";
        blockGame.pen.fillStyle = "DarkRed";
        blockGame.pen.textAlign = "center";
        blockGame.pen.fillText("Game Over", blockGame.paper.width/2, blockGame.paper.height/2);
        blockGame.pen.fillStyle = "Black";
        blockGame.pen.lineWidth = 3;
        blockGame.pen.strokeText("Game Over", blockGame.paper.width/2, blockGame.paper.height/2);
    }, 600);
}

$('#IDontHaveTheTimeForThis').addClass('hidden');