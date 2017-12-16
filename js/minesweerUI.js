$(function() {
    var game,
        rows = 30,
        cols = 30,
        mines = 100,
        tileWidth = 25;

    $('#new-btn').on('click', renderBoard);

    $('#validate-btn').on('click', validateBoard);

    $('#cheat-btn').on('click', cheat);

    function renderBoard() {
        var i, j,
            board = document.createDocumentFragment(),
            space,
            id,
            $spaceButton = $();

        game = new MineSweeper(rows, cols, mines);

        for (i = 0; i < game.rows; i++) {
            for (j = 0; j < game.cols; j++) {
                space = game.board[i][j];
                id = 'space-' + i + '_' + j;

                $spaceButton = $('<button />').data({
                    row: i,
                    col: j,
                    value: space.value,
                    status: space.status
                }).attr('id', id).addClass('closed');

                board.appendChild($spaceButton[0]);
            }
        }

        // ensure previous game is destroyed
        $('#minesweeper').empty().off().width(cols * tileWidth).height(rows * tileWidth).append(board);

        enableEvents();
    }

    function validateBoard() {
        endGame(null, game.checkWin());
    }

    function endGame(e, hasWon) {
        $('#minesweeper').off();

        console.log('hi');

        if (hasWon) {
            alert('you won!');
        } else {
            alert(':(');
        }
    }

    function enableEvents() {
        $('#minesweeper').on('click', 'button', function() {
            if ($(this).hasClass('opened')) {
                return false;
            }

            var data = $(this).data(),
                space = game.board[data.row][data.col];

            game.selectSpace(data.row, data.col);
        }).on('contextmenu', 'button', function() {
            var $space = $(this),
                data = $space.data(),
                newStatus = 'flagged';

            if ($space.hasClass('open')) {
                return false;
            }

            // flag space
            if ($space.hasClass('flagged')) {
                newStatus = 'closed';
                $space.removeClass('flagged');
            }

            game.changeStatus(data.row, data.col, newStatus);

            return false;
        });
    }

    function cheat() {
        game.revealMines();
    }

    $.subscribe('changeStatus', function(e, row, col, space) {
        var status = space.status,
            value = space.value,
            id = '#space-' + row + '_' + col,
            $space = $(id);

        $space.removeClass().addClass(space.status);

        if (status === 'open') {
            if (value === 9) {
                $space.addClass('mine');
            } else if (value > 0) {
                $space.text(value).addClass('value-' + value);
            }
        }
    });

    $.subscribe('endGame', endGame);
});