var React = require('react'),
    ComponentTree = require('react-component-tree'),
    constants = require('../constants.js'),
    grid = require('../lib/grid.js'),
    SquareBlock = require('./SquareBlock.jsx');

require('./WellGrid.less');

class WellGrid extends ComponentTree.Component {
  /**
   * Isolated matrix for the landed Tetriminos inside the Well.
   */
  constructor(props) {
    super(props);

    this.state = {
      grid: grid.generateEmptyMatrix(props.rows, props.cols),
      // Grid blocks need unique IDs to be used as React keys in order to tie
      // them to DOM nodes and prevent reusing them between rows when clearing
      // lines. DOM nodes need to stay the same to animate them when "falling"
      gridBlockCount: 0
    };

    this.children = {
      squareBlock: function(col, row, color) {
        return {
          component: SquareBlock,
          ref: 'c' + col + 'r' + row,
          color: color
        };
      }
    }
  }

  render() {
    return <ul className="well-grid">
      {this._renderGridBlocks()}
    </ul>;
  }

  _renderGridBlocks() {
    var blocks = [],
        widthPercent = 100 / this.props.cols,
        heightPercent = 100 / this.props.rows,
        row,
        col,
        blockValue;

    for (row = 0; row < this.props.rows; row++) {
      for (col = 0; col < this.props.cols; col++) {
        if (!this.state.grid[row][col]) {
          continue;
        }

        blockValue = this.state.grid[row][col];
        blocks.push(
          <li className="grid-square-block"
              key={this._getIdFromBlockValue(blockValue)}
              style={{
                width: widthPercent + '%',
                height: heightPercent + '%',
                top: (row * heightPercent) + '%',
                left: (col * widthPercent) + '%'
              }}>
            {this.loadChild('squareBlock',
                            col,
                            row,
                            this._getColorFromBlockValue(blockValue))}
          </li>);
      }
    }

    return blocks;
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.gridBlockCount !== this.state.gridBlockCount;
  }

  reset() {
    // This Component doesn't update after state changes by default, see
    // shouldComponentUpdate method
    this.setState({
      grid: grid.generateEmptyMatrix(this.props.rows, this.props.cols),
      gridBlockCount: 0
    });
  }

  transferTetriminoBlocksToGrid(tetrimino, tetriminoPositionInGrid) {
    var rows = tetrimino.props.grid.length,
               cols = tetrimino.props.grid[0].length,
               row,
               col,
               relativeRow,
               relativeCol,
               blockCount = this.state.gridBlockCount,
               lines;

    for (row = 0; row < rows; row++) {
      for (col = 0; col < cols; col++) {
        // Ignore blank squares from the Tetrimino grid
        if (!tetrimino.props.grid[row][col]) {
          continue;
        }
        relativeRow = tetriminoPositionInGrid.y + row;
        relativeCol = tetriminoPositionInGrid.x + col;
        // When the Well is full the Tetrimino will land before it enters the
        // top of the Well
        if (this.state.grid[relativeRow]) {
          this.state.grid[relativeRow][relativeCol] =
          ++blockCount + tetrimino.props.color;
        }
      }
    }

    // Clear lines created after landing and transfering a Tetrimino
    lines = this._clearLinesFromGrid(this.state.grid);

    // Push grid updates reactively and update DOM since we know for sure the
    // grid changed here
    this.setState({
      grid: this.state.grid,
      gridBlockCount: blockCount
    });

    // Return lines cleared to measure success of Tetrimino landing :)
    return lines;
  }

  _clearLinesFromGrid(grid) {
    /**
     * Clear all rows that form a complete line, from one left to right, inside
     * the Well grid. Gravity is applied to fill in the cleared lines with the
     * ones above, thus freeing up the Well for more Tetriminos to enter.
     */
    var linesCleared = 0,
        isLine,
        row,
        col;

    for (row = this.props.rows - 1; row >= 0; row--) {
      isLine = true;

      for (col = this.props.cols - 1; col >= 0; col--) {
        if (!grid[row][col]) {
          isLine = false;
        }
      }

      if (isLine) {
        this._removeGridRow(row);
        linesCleared++;
        // Go once more through the same row
        row++;
      }
    }

    return linesCleared;
  }

  _removeGridRow(rowToRemove) {
    /**
     * Remove a row from the Well grid by descending all rows above, thus
     * overriding it with the previous row.
     */
    var row,
        col;

    for (row = rowToRemove; row >= 0; row--) {
      for (col = this.props.cols - 1; col >= 0; col--) {
        this.state.grid[row][col] = row ? this.state.grid[row - 1][col] : null;
      }
    }
  }

  _getIdFromBlockValue(blockValue) {
    return blockValue.split('#')[0];
  }

  _getColorFromBlockValue(blockValue) {
    return '#' + blockValue.split('#')[1];
  }
}

WellGrid.defaultProps = {
  rows: constants.WELL_ROWS,
  cols: constants.WELL_COLS
};

module.exports = WellGrid;
