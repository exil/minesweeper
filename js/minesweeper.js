(function() {
    'use strict';

    var STATUS_CLOSED = 'closed',
        STATUS_OPEN = 'open',
        STATUS_FLAGGED = 'flagged',
        MINE_VALUE = 9;

    var MineSweeper = function(rows, cols, mines) {
        // setup 
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.board = [];

        // game state
        this.mineLocations = [];
        this.boardSize = rows * cols;
        this.spacesRemaining = this.boardSize;

        this.generate();
    };


    MineSweeper.prototype.generate = function() {
        var i, j,
            minesUsed = this.mines,
            randomRow = 0,
            randomCol = 0,
            randomSpace;

        // build out board
        for (i = 0; i < this.rows; i++) {
            this.board[i] = [];

            for (j = 0; j < this.cols; j++) {
                this.board[i][j] = {
                    row: i,
                    col: j,
                    value: 0,
                    status: STATUS_CLOSED
                };
            }
        }

        // randomly place mines
        while (minesUsed > 0) {
            randomRow = Math.floor(Math.random() * this.rows);
            randomCol = Math.floor(Math.random() * this.cols);

            randomSpace = this.board[randomRow][randomCol];

            if (randomSpace.value === 0) {
                randomSpace.value = MINE_VALUE;
                this.mineLocations.push(randomSpace);
                minesUsed--;
            }
        }

        this.calculateDistance();
    };

    /* used for console log printing */
    MineSweeper.prototype.revealBoard = function() {
        var i, j, 
            result = '';

        for (i = 0; i < this.rows; i++) {
            for (j = 0; j < this.cols; j++) {
                result += this.board[i][j].value + ' ';
            }

            result += "\n";
        }
    };

    /* used for console log printing */
    MineSweeper.prototype.printBoard = function() {
        var i, j, 
            result = '';

        for (i = 0; i < this.rows; i++) {
            for (j = 0; j < this.cols; j++) {
                if (this.board[i][j].status === STATUS_OPEN) {
                    result += this.board[i][j].value + ' ';
                } else if (this.board[i][j].status === STATUS_FLAGGED) {
                    result += 'F' + ' ';
                } else {
                    result += 'X' + ' ';
                }
            }

            result += '\n';
        }
    };

    MineSweeper.prototype.selectSpace = function(row, col) {
        this.floodFill(row, col);
    };

    /*
        keep opening spaces until we hit a non-zero space
    */
    MineSweeper.prototype.floodFill = function(row, col) {
        if (this.isValidSpace(row, col) && this.board[row][col].status === STATUS_CLOSED) {
            this.changeStatus(row, col, STATUS_OPEN);

            /*
            uncomment this for auto-validate

            if (this.checkWin()) {
                this.endGame(true);

                return false;
            }
            */

            if (this.board[row][col].value === MINE_VALUE) {
                this.endGame(false);

                return false;
            }

            if (this.board[row][col].value === 0) {
                this.floodFill(row - 1, col);
                this.floodFill(row - 1, col - 1);
                this.floodFill(row - 1, col + 1);
                this.floodFill(row + 1, col);
                this.floodFill(row + 1, col - 1);
                this.floodFill(row + 1, col + 1);
                this.floodFill(row, col - 1);
                this.floodFill(row, col + 1);
            }
        }
    };

    MineSweeper.prototype.endGame = function(hasWon) {
        if (!hasWon) {
            // publish on lose only for non-auto-validation
            $.publish('endGame', [false]);
        }
    };

    MineSweeper.prototype.changeStatus = function(row, col, status) {
        if ((status !== STATUS_OPEN && status !== STATUS_CLOSED && status !== STATUS_FLAGGED) 
            || this.board[row][col].status === status || !this.isValidSpace(row, col)) {
            return false;
        }

        this.board[row][col].status = status;
        $.publish('changeStatus', [row, col, this.board[row][col]]);

        if (status === STATUS_OPEN) {
            this.spacesRemaining--;
        }

        return true;
    };

    /*
        reveal mines by opening them (if the user lost)
        or by flagging them (if the user is cheating)
    */
    MineSweeper.prototype.revealMines = function(status) {
        var i,
            space;

        for (i = 0; i < this.mines; i++) {
            space = this.mineLocations[i];

            this.changeStatus(space.row, space.col, status);
        }
    };

    /*
        Removes all flags and replaces them with the correct
        ones.
    */
    MineSweeper.prototype.cheat = function() {
        // get all flagged mines
        var i,
            flaggedMines = this.getSpacesByStatus(STATUS_FLAGGED),
            len = flaggedMines.length;
        
        for (i = 0; i < len; i++) {
            this.changeStatus(flaggedMines[i].row, flaggedMines[i].col, STATUS_CLOSED);
        }

        this.revealMines(STATUS_FLAGGED);
    };

    /*
        deprecated functions
        MineSweeper.prototype.openSpace = function(row, col) {
            if (this.board[row][col].status === STATUS_CLOSED) {
                this.board[row][col].status = STATUS_OPEN;
                this.spacesRemaining--;
            }
        };

        MineSweeper.prototype.flagSpace = function(row, col) {
            if (this.board[row][col].status === STATUS_CLOSED) {
                this.board[row][col].status = STATUS_FLAGGED;
                this.spacesRemaining--;
            }
        }

        MineSweeper.prototype.flagSpace = function(row, col) {
            if (this.board[row][col].status === STATUS_FLAGGED) {
                this.board[row][col].status = STATUS_CLOSED;
                this.spacesRemaining++;
            }
        }
    */

    /*
        a user can win if they've flagged all the mines
        or if the number of remaining tiles === the number of mines
    */
    MineSweeper.prototype.checkWin = function() {
        var i,
            allFlagged = true,
            flaggedSpaces = this.getSpacesByStatus(STATUS_FLAGGED),
            len = flaggedSpaces.length;

        if (len === this.mines) {
            for (i = 0; i < len; i++) {
                if (flaggedSpaces[i].value !== MINE_VALUE) {
                    allFlagged = false;
                } 
            }
        } else {
            allFlagged = false;
        }

        return this.spacesRemaining === this.mines || allFlagged;
    };

    MineSweeper.prototype.isValidSpace = function(row, col) {
        return !(row < 0 || col < 0 || row >= this.rows || col >= this.cols);
    };

    MineSweeper.prototype.getSpacesByStatus = function(status) {
        var i, j, space,
            result = [];

        for (i = 0; i < this.rows; i++) {
            for (j = 0; j < this.cols; j++) {
                space = this.board[i][j];

                if (space.status === status) {
                    result.push(space);
                }
            }
        }

        return result;
    };

    /*
        calculate mine proxomity for each space touching a mine
    */
    MineSweeper.prototype.calculateDistance = function() {
        var i,
            self = this,
            currentLocation, row, col;

        for (i = 0; i < this.mineLocations.length; i++) {
            currentLocation = this.mineLocations[i];
            row = currentLocation.row;
            col = currentLocation.col;

            updateSpace(row - 1, col);
            updateSpace(row - 1, col - 1);
            updateSpace(row - 1, col + 1);
            updateSpace(row + 1, col);
            updateSpace(row + 1, col - 1);
            updateSpace(row + 1, col + 1);
            updateSpace(row, col - 1);
            updateSpace(row, col + 1);
        }

        // 
        function updateSpace(row, col) {
            if (self.isValidSpace(row, col)) {   
                var space = self.board[row][col];

                // not a mine
                if (space.value !== MINE_VALUE) {
                    space.value++;
                }
            }
        }
    };

    window.MineSweeper = MineSweeper;
})();