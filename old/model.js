let population = [];

let n_susceptible = 100;
let n_infected = 20;
let n_removed = 0;
let n_people = n_susceptible + n_infected + n_removed;
let susceptibleText, infectedText, removedText;
let susceptibleHistory = [];
let infectedHistory = [];
let removedHistory = [];
let timeToDetect = 200;

let speedSlider;


function addPeople(count, type) {
    for(let i = 0; i < count; i++) {
        population.push(new Person(type));
    }
}

function setup() {
    var canvas = createCanvas(displayWidth, 600);
    canvas.parent('sketch-holder');

    background(255);
    
    susceptibleText = createP("Susceptible: " + n_susceptible);
    susceptibleText.addClass("susceptible");

    infectedText = createP("Infected: " + n_infected);
    infectedText.addClass("infected");

    removedText = createP("Removed: " + n_removed);
    removedText.addClass("removed");

    addPeople(n_susceptible, 0);
    addPeople(n_infected, 1);
}

function updatePopulation() {
    for (let i = 0; i < n_people; i++) {
        if(!population[i].removed) {
            if(population[i].detectTimeCount == timeToDetect)
                removePerson(population[i]);
            population[i].update();
        }
    }
}

function canInfect(p1, p2) {
    return (p1.color == 'red' && p2.color == 'blue') || (p1.color == 'blue' && p2.color == 'red');
}

function infect(p1) {
    p1.color = 'red';
    p1.health = 1;
}

function removePerson(p1) {
    p1.x = -100;
    p1.y = -100;
    p1.speed_x = 0;
    p1.speed_y = 0;
    p1.removed = true;

    n_removed += 1;
    n_infected -= 1;
}

function interact() {
    for (let i = 0; i < n_people; i++) {
        for (let j = i; j < n_people; j++) {
            if(i != j && population[i].collidedWith(population[j])) {
                if (canInfect(population[i], population[j])) {
                    infect(population[i]);
                    infect(population[j]);
                    n_infected += 1;
                    n_susceptible -= 1;
                }
            }
        }
    }
}

function drawPopulation() {
    for (let i = 0; i < n_people; i++) {
        if(!population[i].removed)
            population[i].draw();
    }
}
let frame = 0;
function draw() {
    background(255);

    updatePopulation();
    interact();
    drawPopulation();
    susceptibleHistory.push(new GPoint(frame, n_susceptible));
    infectedHistory.push(new GPoint(frame, n_infected));
    removedHistory.push(new GPoint(frame, n_removed));
    frame += 1;
    susceptibleText.html("Susceptible: " + n_susceptible);
    infectedText.html("Infected: " + n_infected);
    removedText.html("Removed: " + n_removed);

    if (n_infected == 0) {
        noLoop();
        clear();
        var plot = new GPlot(this);
        plot.setPos(0, 0);
        plot.setDim(width, height);
        plot.startHistograms(GPlot.VERTICAL);
        plot.setPoints(susceptibleHistory);
        plot.setLineColor('blue');
        plot.setPointColor(color(0,0,0,0));
        plot.addLayer("Layer1", infectedHistory);
        plot.getLayer("Layer1").setLineColor('red');
        plot.getLayer("Layer1").setPointColor(color(0,0,0,0));
        plot.addLayer("Layer2", removedHistory);
        plot.getLayer("Layer2").setLineColor('green');
        plot.getLayer("Layer2").setPointColor(color(0,0,0,0));
        plot.activatePanning();

        plot.defaultDraw();
    }
}

// 0 = healthy
// 1 = infected
// 2 = removed
class Person {
    constructor(health) {
        this.radius = 5;
        this.x = random(this.radius, width - this.radius);
        this.y = random(this.radius, height - this.radius);
        this.speed_x = 3;
        this.speed_y = 3;
        this.max_speed = 3;
        this.health = health;
        this.detectTimeCount = 0;
        this.removed = false;

        if (this.health == 1)
            this.color = 'red';
        if (this.health == 0) 
            this.color = 'blue';
    }

    getNewSpeed(currentSpeed, maxSpeed) {
        let newSpeed;
        if (currentSpeed) {
            newSpeed = currentSpeed + sin(random() * 2 - 1);
            if (abs(newSpeed) > maxSpeed) {
                newSpeed = Math.sign(newSpeed) * maxSpeed;
            }
        } else {
            newSpeed = sin(random() * 2 - 1) * maxSpeed;
        }
        return newSpeed;
    }

    update() {
        if(this.health == 1) {
            this.detectTimeCount += 1;
        }

        this.speed_x = this.getNewSpeed(this.speed_x, this.max_speed);
        this.speed_y = this.getNewSpeed(this.speed_y, this.max_speed);
        if (this.x > width - 2 * this.radius || this.x < 0)
            this.speed_x *= -1;

        if (this.y > height - 2 * this.radius || this.y < 0)
            this.speed_y *= -1;

        this.x += this.speed_x;
        this.y += this.speed_y;
    }

    draw() {
        fill(this.color);
        ellipse(this.x, this.y, this.radius * 2, this.radius * 2);

    }

    collidedWith(p) {
        let d = dist(this.x, this.y, p.x, p.y);
        return d < (this.radius + p.radius);
    }
}