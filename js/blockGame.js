var blockGame = new CreateGameMaster("genericFallingBlockPuzzleGame");
var backgroundTexture = new GameBGObject(blockGame, 0, 0, blockGame.paper.width, blockGame.paper.height,
    {
        drawFrame: function()
        {
            this.sprite.render(blockGame, 0, 0);
        }
    });
    backgroundTexture.sprite = new GameSprite("media/blockBack.png",480,720,1,1);
var backgroundColorMask = new GameBGObject(blockGame, 0, 0, blockGame.paper.width, blockGame.paper.height,
    {
        color:"blue",
        drawFrame: function()
        {
            this.GameObject.pen.globalAlpha = 0.5;
            this.GameObject.pen.fillStyle = this.color;
            this.GameObject.pen.fillRect(this.x, this.y, this.width, this.height);
            this.GameObject.pen.globalAlpha = 1;
        }
    });
console.info(blockGame);
blockGame.init();