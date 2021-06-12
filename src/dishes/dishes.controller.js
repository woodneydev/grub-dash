const path = require("path");

// The existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Function to assign ID's when necessary
const nextId = require("../utils/nextId");

// Validation functions

// Check for dishId param
const isThereId = (req, res, next) => {
    const {dishId} = req.params;
    if (dishId) {
        next();
    } else {
        next({status: 404, message: `No path for ${req.orinalUrl}`});
    }
}

// Check for whether Id exists in dishes-data 
const doesDishExist = (req, res, next) => {
    const {dishId} = req.params;
    const matchedDish = dishes.find(dish => dish.id === dishId);
    if (matchedDish) {
        res.locals.matchedDish = matchedDish;
        next();
    } else {
        next({status: 404, message: `Dish does not exist: ${req.params.dishId}`});
    }
}

// Check for whether incoming request contains the necessary keys with valid values
const doesReqHaveProps = (req, res, next) => {
    const { data: { name, description, price, image_url } = {} } = req.body;

    if (!name || typeof name !== "string") next({status: 400, message: `Dish must include a name`});
    if (!description || typeof name !== "string") next({status: 400, message: `Dish must include a description`});
    if (price <= 0 || typeof price !== "number") next({status: 400, message: `Dish must include a price`});
    if (!image_url || typeof name !== "string") next({status: 400, message: `Must include a image_url`});

    next();
}

// Check for whether request param dishId matches with request body Id
const doesIdMatch = (req, res, next) => {
    const { data: { id } = {} } = req.body;
    const {dishId} = req.params;
    if (!id) next();
    if (id === dishId) {
        next();
    } else {
        next({status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`});
    }
}

// Route functions
const create = (req, res) => {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const id = nextId();
    const newDish = {id, name, description, price, image_url};
    dishes.push(newDish);
    res.status(201).json({data: newDish});
}

const read = (req, res) => {
    const {matchedDish} = res.locals;
    res.status(200).json({data: matchedDish});
}

const update = (req, res, next) => {
    const {dishId} = req.params;
    const { data: { name, description, price, image_url } = {} } = req.body;
    const index = dishes.findIndex(dish => dish.id === dishId);
    const updatedDish = {id: dishId, name, description, price, image_url};
    dishes[index] = updatedDish;
    res.status(200).json({data: updatedDish});
}

const list = (req, res) => {
    res.status(200).json({data: dishes});
}

module.exports = {
    list,
    create: [doesReqHaveProps, create],
    update: [isThereId, doesDishExist, doesReqHaveProps, doesIdMatch, update],
    read: [isThereId, doesDishExist, read],
}