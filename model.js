var canvas = document.getElementById("simulationContainer");
var context = canvas.getContext('2d');
var width = canvas.width;
var height = canvas.height;

var populationSpeed;
var socialDistancingRate;

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}


const types = {
    SUSCEPTIBLE: 's',
    INFECTED: 'i',
    REMOVED: 'r'
}

const colors = {
    SUSCEPTIBLE: 'blue',
    INFECTED: 'red',
    REMOVED: 'green'
}

// s = susceptible
// i = infected
class Person {
    constructor(type) {
        this.radius = 5;
        this.cx = getRandom(this.radius, width - this.radius);
        this.cy = getRandom(this.radius, height - this.radius);
        this.max_speed = populationSpeed;
        this.speed_x = 3;
        this.speed_y = 3;
        this.type = type;
        this.acc_x = 0;
        this.acc_y = 0;
        if(type == types.SUSCEPTIBLE)
            this.color = colors.SUSCEPTIBLE;
        else if (type == types.INFECTED)
            this.color = colors.INFECTED;
    }

    draw() {
        context.beginPath();
        context.arc(this.cx, this.cy, this.radius, 0. ,2 * Math.PI, false);
        context.fillStyle = this.color;
        context.fill();
        context.stroke();
    }

    metWith(p, threshold) {
        var delta_x = this.cx - p.cx;
        var delta_y = this.cy - p.cy;
        var dist = Math.sqrt(delta_x * delta_x + delta_y * delta_y);
        return dist < threshold
    }

    canInfect(p) {
        return (this.type == types.INFECTED && p.type == types.SUSCEPTIBLE);
    }

    repelFrom(p) {
        var delta_x = - this.cx + p.cx;
        var delta_y = - this.cy + p.cy;
        var dist = delta_x * delta_x + delta_y * delta_y;
        var force_x = - 10 / dist;
        var force_y = - 10 / dist;

        this.acc_x += force_x;
        this.acc_y += force_y;
    }

    infect() {
        this.type = types.INFECTED;
        this.color = colors.INFECTED;
    }

    getNewSpeed(currentSpeed, maxSpeed) {
        let newSpeed;
        if (currentSpeed) {
            newSpeed = currentSpeed + Math.sin(Math.random() * 2 - 1);
            if (Math.abs(newSpeed) > maxSpeed) {
                newSpeed = Math.sign(newSpeed) * maxSpeed;
            }
        } else {
            newSpeed = Math.sin(Math.random() * 2 - 1) * maxSpeed;
        }
        return newSpeed;
    }

    move() {
        this.speed_x = this.getNewSpeed(this.speed_x, this.max_speed);
        this.speed_y = this.getNewSpeed(this.speed_y, this.max_speed);
        if (this.cx > width - this.radius || this.cx < this.radius)
            this.speed_x *= -1;

        if (this.cy > height - this.radius || this.cy < this.radius)
            this.speed_y *= -1;

        this.cx += this.speed_x;
        this.cy += this.speed_y;
    }
}



var population = [];

var n_susceptible = 5;
var n_infected = 1;
var n_removed = 0;
var n_people = n_susceptible + n_infected + n_removed;

// Chart ----------------------------------------
var dps_susceptible = [];
var dps_infected = [];
var chart = new CanvasJS.Chart("chartContainer", {
	exportEnabled: true,
	title :{
		text: "Dynamic Spline Chart"
	},
	axisY: {
		includeZero: false
	},
	data: [{
		type: "splineArea",
		markerSize: 0,
		dataPoints: dps_susceptible 
    }, {
		type: "splineArea",
		markerSize: 0,
		dataPoints: dps_infected 
    }]
});

var xVal = 0;
var yVal = n_susceptible;
var updateInterval = 1000;
var dataLength = 50; // number of dataPoints visible at any point
var updateChart = function (count) {
    dps_susceptible.push({
        x: xVal,
        y: n_susceptible
    });
    dps_infected.push({
        x: xVal,
        y: n_infected
    });
    xVal++;
	if (dps_susceptible.length > dataLength) {
        dps_susceptible.shift();
        dps_infected.shift();
	}
	chart.render();
};


// End chart -------------------------------------

// Update stuff above chart
var susCountDiv = document.getElementById("susceptibleCount");
var infCountDiv = document.getElementById("removedCount");
var remCountDiv = document.getElementById("infectedCount");
var updateCounts = function() {
    susCountDiv.textContent = "Susceptible: " + n_susceptible;
    infCountDiv.textContent = "Infected: " + n_infected;
    remCountDiv.textContent = "Removed: " + n_removed;
};  
updateCounts();
setInterval(function(){updateCounts()}, updateInterval);
// End -------------------------------------------

function addPeople(count, type) {
    for(let i = 0; i < count; i++) {
        population.push(new Person(type));
    }
}

function drawPopulation() {
    for(let i = 0; i < n_people; i++) {
        population[i].draw();
    }
}

function movePopulation() {
    for(let i = 0; i < n_people; i++) {
        population[i].move();
    }
}

function interactPopulation() {
    for(let i = 0; i < n_people; i++) {
        for(let j = 0; j < n_people; j++) {
            if(i != j) {
            population[i].repelFrom(population[j]);
            
            if(population[i].metWith(population[j], 6)) {
                if(population[i].canInfect(population[j]) || population[j].canInfect(population[i])) {
                    population[i].infect();
                    population[j].infect();
                    n_susceptible -= 1;
                    n_infected += 1;
                }
            }
        }
        }
    }
}



function setup() {
    populationSpeed = document.getElementById("populationSpeed").value;

    addPeople(n_susceptible, types.SUSCEPTIBLE);
    addPeople(n_infected, types.INFECTED);
}

function loop() {
    requestAnimationFrame(loop);
    context.clearRect(0, 0, canvas.width, canvas.height);

    movePopulation();
    interactPopulation();
    drawPopulation();
}

var startSimButton = document.getElementById("startSimulation");
startSimButton.onclick = function() {
    setup();
    loop();
    updateChart(dataLength); 
    setInterval(function(){ updateChart() }, updateInterval);
    startSimButton.disabled = true;
}

var reloadButton = document.getElementById("reload");
reloadButton.onclick = function() {
    document.location.reload();
}