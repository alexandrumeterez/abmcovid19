var canvas = document.getElementById("simulationContainer");
var context = canvas.getContext('2d');
var width = canvas.width;
var height = canvas.height;

var populationSpeed;
var socialDistancingRate;
var enableSocialDistancing;

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}


const types = {
    SUSCEPTIBLE: 's',
    ASYMPTOMATIC: 'a',
    INFECTED: 'i',
    REMOVED: 'r'
}

const colors = {
    SUSCEPTIBLE: 'blue',
    ASYMPTOMATIC: 'yellow',
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
        this.speed_x = 3 * (Math.floor(Math.random() * 2) || -1);
        this.speed_y = 3 * (Math.floor(Math.random() * 2) || -1);
        this.type = type;
        this.acc_x = 0;
        this.acc_y = 0;
        if (Math.random() < socialDistancingRate)
            this.practicesSocialDistance = true;
        else
            this.practicesSocialDistance = false;
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

    getBounds() {
        return [this.cx - this.radius, this.cy - this.radius, this.cx + this.radius, this.cy + this.radius]
    }

    intersects(p) {
        var myBounds = this.getBounds();
        var pBounds = p.getBounds();

        return !(myBounds[0] > pBounds[3] || 
                myBounds[3] > pBounds[0] ||
                myBounds[1] > pBounds[4] ||
                myBounds[4] > pBounds[1]);  
    }

    collideWith(p) {
        var dx = this.cx - p.cx;
        var dy = this.cy - p.cy;

        var dist = Math.sqrt(dx*dx + dy*dy);

        if(dist <= 2 * this.radius) {
            this.speed_x *= -1;
            this.speed_y *= -1;

            this.cx += this.speed_x + 0.5;
            this.cy += this.speed_y + 0.5;
        }
    }

    canInfect(p) {
        return (this.type == types.INFECTED && p.type == types.SUSCEPTIBLE);
    }

    applyForce(force_x, force_y) {
        this.acc_x += force_x;
        this.acc_y += force_y;
    }

    calculateRepulsion(p) {
        var force_x = this.cx - p.cx;
        var force_y = this.cy - p.cy;
        var distance = Math.sqrt(force_x*force_x + force_y*force_y);

        // normalize
        force_x /= distance;
        force_y /= distance;

        // distance = Math.min(Math.max(distance, 1), 25);
        // distance = Math.constrain(distance, 5, 25);

        var G = 50;
        var strength = - G / (distance * distance);
        force_x *= strength;
        force_y *= strength;
        return [force_x, force_y];
    }

    infect() {
        this.type = types.INFECTED;
        this.color = colors.INFECTED;
    }

    move() {
        this.applyForce(Math.random() -0.5, Math.random() -0.5);
        this.speed_x += this.acc_x;
        this.speed_y += this.acc_y;

        if (this.cx > width - 2 * this.radius || this.cx <  2 *  this.radius) {
            this.speed_x *= -1;
            if(this.cx > width - 2 * this.radius)
                this.cx = width - 2 * this.radius;
            else if (this.cx <  2 *  this.radius)
                this.cx =  2 *  this.radius
        }

        if (this.cy > height - 2 * this.radius || this.cy < 2 * this.radius) {
            this.speed_y *= -1;
            if(this.cy > height - 2 * this.radius)
                this.cy = height - 2 * this.radius;
            else if (this.cy < 2 * this.radius)
                this.cy = 2 * this.radius;
        }

        if (Math.abs(this.speed_x) > this.max_speed)
            this.speed_x = Math.sign(this.speed_x) * this.max_speed;

        if (Math.abs(this.speed_y) > this.max_speed)
            this.speed_y = Math.sign(this.speed_y) * this.max_speed;
        if (this.practicesSocialDistance && enableSocialDistancing == true) {
            this.speed_x *= 0.4;
            this.speed_y *= 0.4;
        }

        this.cx += this.speed_x;
        this.cy += this.speed_y;

        this.acc_x *= 0;
        this.acc_y *= 0;
    }
}



var population = [];

var n_susceptible = 100;
var n_infected = 10;
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
        population[i].max_speed = populationSpeed;
        population[i].move();
    }
}

function applyForces() {
    for(let i = 0; i < n_people; i++) {
        for(let j = 0; j < n_people; j++) {
            if(i != j) {
                // population[i].collideWith(population[j]);

                if (enableSocialDistancing) {
                    var force = population[j].calculateRepulsion(population[i]);
                    population[i].applyForce(force[0], force[1]);
                }
            }
        }
    }
}

function applyCollisions() {
    for(let i = 0; i < n_people; i++) {
        for(let j = 0; j < n_people; j++) {
            if(i != j) {
                population[i].collideWith(population[j]);
            }
        }
    }
}

function interactPopulation() {
    for(let i = 0; i < n_people; i++) {
        for(let j = 0; j < n_people; j++) {
            if(i != j) {
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


function setValues() {
    populationSpeed = document.getElementById("populationSpeed").value;
    enableSocialDistancing = document.getElementById("enableSocialDistancing").checked;
    socialDistancingRate = document.getElementById("socialDistancingRate").value;
}

function setup() {

    setValues();
    addPeople(n_susceptible, types.SUSCEPTIBLE);
    addPeople(n_infected, types.INFECTED);
}

function loop() {
    requestAnimationFrame(loop);
    context.clearRect(0, 0, canvas.width, canvas.height);

    setValues();
    applyForces();
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