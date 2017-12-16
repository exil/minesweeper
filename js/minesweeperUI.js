/*global MineSweeper:false */
var minesweeperUI = (function() {
    'use strict';

    var game,
        inProgress = false,
        flagsUsed = 0,
        MODES = {
            easy: {
                rows: 8,
                cols: 8,
                mines: 10
            },
            medium: {
                rows: 15,
                cols: 15,
                mines: 40
            },
            hard: {
                rows: 15,
                cols: 30,
                mines: 99
            },
            insane: {
                rows: 35,
                cols: 35,
                mines: 300
            }
        },
        TILE_WIDTH = 25,
        STATUS_CLOSED = 'closed',
        STATUS_OPEN = 'open',
        STATUS_FLAGGED = 'flagged',
        MINE_VALUE = 9;

    function init() {
        $('#new-btn').on('click', renderBoard);
        $('#validate-btn').on('click', validateBoard);
        $('#cheat-btn').on('click', cheat);

        /* game logic and UI communication */
        $.subscribe('changeStatus', changeStatus);
        $.subscribe('endGame', endGame);
    }

    function renderBoard() {
        var i, j,
            board = document.createDocumentFragment(),
            space,
            id,
            mode = $('#mode').val(),
            rows = MODES[mode].rows,
            cols = MODES[mode].cols,
            mines = MODES[mode].mines,
            $spaceButton = $();

        game = new MineSweeper(rows, cols, mines);
        inProgress = true;
        flagsUsed = 0;
        updateRemainingCount(flagsUsed);

        for (i = 0; i < game.rows; i++) {
            for (j = 0; j < game.cols; j++) {
                space = game.board[i][j];
                id = 'space-' + i + '_' + j;

                $spaceButton = $('<button />').data({
                    row: i,
                    col: j,
                    value: space.value,
                    status: space.status
                }).attr('id', id).addClass(STATUS_CLOSED);

                board.appendChild($spaceButton[0]);
            }
        }

        // ensure previous game is destroyed
        $('#minesweeper').empty().off().width(cols * TILE_WIDTH).height(rows * TILE_WIDTH).append(board);
        $('#end-text').hide();
        $('.action-item').show();

        enableBoardEvents();
    }

    function validateBoard() {
        if (inProgress) {
            endGame(null, game.checkWin());
        }

        return false;
    }

    function cheat() {
        if (inProgress) {
            game.cheat();

            // count how many have 'flagged' class
            flagsUsed = $('#minesweeper').find('button.flagged').length;

            updateRemainingCount(flagsUsed);
        }
    }

    function enableBoardEvents() {
        $('#minesweeper').on('click', 'button', function() {
            if ($(this).hasClass(STATUS_OPEN)) {
                return false;
            }

            var data = $(this).data();

            game.selectSpace(data.row, data.col);
        }).on('contextmenu', 'button', function() {
            var $space = $(this),
                data = $space.data(),
                newStatus = STATUS_FLAGGED;

            if ($space.hasClass(STATUS_OPEN)) {
                return false;
            }

            // flag space
            if ($space.hasClass(STATUS_FLAGGED)) {
                newStatus = STATUS_CLOSED;
                $space.removeClass(STATUS_FLAGGED);
                flagsUsed--;
            } else {
                flagsUsed++;
            }

            updateRemainingCount(flagsUsed);

            game.changeStatus(data.row, data.col, newStatus);

            return false;
        });
    }

    function updateRemainingCount(usedCount) {
        var remaining = game.mines - usedCount,
            text = remaining + ' mine' + (remaining !== 1 ? 's' : '');

        $('.mine-text').text(text);
    }

    function changeStatus(e, row, col, space) {
        var status = space.status,
            value = space.value,
            id = '#space-' + row + '_' + col,
            $space = $(id);

        $space.removeClass().addClass(space.status);

        if (status === STATUS_OPEN) {
            if (value === MINE_VALUE) {
                $space.addClass('mine');
            } else if (value > 0) {
                $space.text(value).addClass('value-' + value);
            }
        }
    }

    function endGame(e, hasWon) {
        $('#minesweeper').off();

        inProgress = false;

        if (hasWon) {
            $('#end-text').show().text('You win! B)');
            $('.action-item').hide();
        } else {
            game.revealMines('open');
            $('#end-text').show().text('You lose! :\'(');
            $('.action-item').hide();

            updateRemainingCount(game.mines);
        }
    }

    return {
        init: init
    };
})();

$(minesweeperUI.init);