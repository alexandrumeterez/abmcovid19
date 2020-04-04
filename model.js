var canvas = document.getElementById("simulationContainer");
var context = canvas.getContext('2d');
var width = canvas.width;
var height = canvas.height;

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
        this.max_speed = 2;
        this.speed_x = 3;
        this.speed_y = 3;
        this.type = type;
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

var n_susceptible = 300;
var n_infected = 1;
var n_removed = 0;
var n_people = n_susceptible + n_infected + n_removed;

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
        for(let j = i + 1; j < n_people; j++) {
            if(population[i].metWith(population[j], 6)) {
                if(population[i].canInfect(population[j]) || population[j].canInfect(population[i])) {
                    population[i].infect();
                    population[j].infect();
                }
            }
        }
    }
}




function setup() {
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
setup();
loop();