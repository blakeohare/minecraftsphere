window.addEventListener('load', () => {
    let ui = [
        'diameter',
        'genbtn',
        'slicepanel',
        'slicenum',
        'grid',
        'error',
        'prevbtn',
        'nextbtn',
    ].reduce((lookup, id) => {
        lookup[id] = document.getElementById(id);
        return lookup;
    }, {});

    let activeDiameter = null;
    let sliceNum = null;
    
    ui.prevbtn.addEventListener('click', () => {
        sliceNum--;
        updateUi();
    });
    ui.nextbtn.addEventListener('click', () => {
        sliceNum++;
        updateUi();
    });
    
    ui.genbtn.addEventListener('click', () => {
        activeDiameter = tryParseInt('' + ui.diameter.value);
        if (activeDiameter < 3) activeDiameter = null;
        
        if (activeDiameter) {
            sliceNum = Math.ceil(activeDiameter / 2);
        }

        updateUi();
    });

    let clear = e => {
        while (e.firstChild) e.removeChild(e.firstChild);
        return e;
    };

    let makeEmptyGrid = (w, h) => {
        let grid = [];
        while (w --> 0) {
            grid.push("x".repeat(h).split('').map(() => false));
        }
        return grid;
    };

    let tryParseInt = n => {
        if (typeof n !== 'number') n = parseInt(`${n}`);
        if (isNaN(n)) return null;
        if (!isFinite(n)) return null;
        return n;
    };

    let generateSliceGrid = (z, diameter) => {
        let slice;
        if (z === 1 || z === diameter) {
            // Don't remove the interior if it's the slice at the top or bottom.
            slice = generateSliceCircle(z, diameter, true);
        } else {
            // Determeine which z value for the slice that is more towards the exterior.
            let az = 2 * (z - .5) / diameter - 1;
            let adjacent = z + (az > 0 ? 1 : -1);

            // Generate both the current slice and the next slice towards the exterior.
            slice = generateSliceCircle(z, diameter);
            let nextSlice = generateSliceCircle(adjacent, diameter);

            // Because the interior is empty, we need to fill back in some of 
            // the blocks that were removed since the next slice may not 
            // necessary cover it.
            for (let x = 0; x < diameter; x++) {
                for (let y = 0; y < diameter; y++) {
                    if (nextSlice[x][y] === 0 && slice[x][y] === -1) {
                        slice[x][y] = 1;
                    }
                }
            }
        }

        return slice.map(row => row.map(c => c === 1));
    };

    let generateSliceCircle = (z, diameter, skipInteriorRemoval) => {

        let grid = makeEmptyGrid(diameter);

        // x, y, and z are the game coordinates
        // ax, ay, and az are the coordinates mapped to the range of -1 to 1
        // Iterate through each square in the slice.
        // Within each slice, divide it into a 4x4x4 sub cubes.
        // Check the center of each of those cubes. If they're within 1 of (0, 0, 0) then
        // it's part of the sphere.

        let az = 2 * (z - .5) / diameter - 1;

        let subdivs = [-0.5, -0.25, 0, 0.25, 0.5].map(v => 2 * v / diameter);

        for (let y = 0; y < diameter; y++) {
            let ay = 2 * ((y + 0.5) / diameter) - 1;
            for (let x = 0; x < diameter; x++) {
                let ax = 2 * ((x + 0.5) / diameter) - 1;
                let touchCount = 0;
                for (sx of subdivs) {
                    for (sy of subdivs) {
                        for (sz of subdivs) {
                            // sqrt not necessary but doing it anyway to be mathematically polite.
                            let bx = sx + ax;
                            let by = sy + ay;
                            let bz = sz + az;
                            let dist = Math.sqrt(bx ** 2 + by ** 2 + bz ** 2);
                            if (dist <= 1) touchCount++;
                        }
                    }
                }
                let isFilled = touchCount / (5 ** 3) > .5;
                grid[x][y] = isFilled ? 1 : 0;
            }
        }

        if (!skipInteriorRemoval) {
            // anything that isn't touching the edge and isn't touching a non-filled 
            // value on a non-diagonal side should be toggled off.
            let neighborOffsets = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (let x = 1; x < diameter - 1; x++) {
                for (let y = 1; y < diameter - 1; y++) {
                    if (grid[x][y] === 1) {
                        
                        let isExterior = false;
                        for (let [ox, oy] of neighborOffsets) {
                            let nx = ox + x;
                            let ny = oy + y;
                            if (grid[nx][ny] === 0) {
                                isExterior = true;
                            }
                        }
                        if (!isExterior) {
                            grid[x][y] = -1;
                        }
                    }
                }
            }
        }

        return grid;
    };

    let updateUi = () => {
        let error = "";
        if (!activeDiameter || activeDiameter < 3) {
            error = "Please choose a diameter greater than or equal to 3.";
        } else if (sliceNum < 1 || sliceNum > activeDiameter) {
            error = "Slice is not in range.";
        }
        
        let isError = !!error;
        ui.slicepanel.style.display = isError ? 'none' : 'block';
        clear(ui.error).innerText = error;
        clear(ui.grid);
        if (isError) return;

        let sliceGrid = generateSliceGrid(sliceNum, activeDiameter);

        sliceGrid.map(row => {
            let tr = document.createElement('tr');
            row.map(isFilled => {
                let td = document.createElement('td');
                
                td.style.border = '1px solid #000';
                if (isFilled) {
                    let img = document.createElement('img');
                    img.src = 'grass.jpg';
                    img.style.display = 'block';
                    img.width = 30;
                    img.height = 30;
                    td.append(img);
                } else {
                    let white = document.createElement('div');
                    white.style.width = '30px';
                    white.style.height = '30px';
                    td.append(white);
                }
                td.style.padding = 0;
                tr.append(td);
            });
            ui.grid.append(tr);
            ui.grid.style.borderSpacing = 0;
        });

        clear(ui.slicenum).innerText = `Slice ${sliceNum} out of ${activeDiameter}`;
        ui.prevbtn.disabled = sliceNum === 1;
        ui.nextbtn.disabled = sliceNum === activeDiameter;
    };
});
