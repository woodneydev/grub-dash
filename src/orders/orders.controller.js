const path = require("path");

// The existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// Validation functions

// Check for orderId param
const isThereId = (req, res, next) => {
    const { orderId } = req.params;
    if (orderId) {
        next();
    } else {
        next({ status: 400, message: `Must specify orderId` });
    }
}

// Check for whether orderId param exists in orders-data
const doesOrderExist = (req, res, next) => {
    const { orderId } = req.params;
    const matchedOrder = orders.find(order => order.id === orderId);
    if (matchedOrder) {
        res.locals.matchedOrder = matchedOrder
        next();
    } else {
        next({ status: 404, message: `OrderId ${orderId} does not exist` });
    }
}

// Check whether incoming request contains necessary keys and valid values
const doesReqhaveprops = (req, res, next) => {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

    if (!deliverTo || typeof deliverTo !== "string") next({ status: 400, message: `Order must include a deliverTo` });
    if (!mobileNumber || typeof deliverTo !== "string") next({ status: 400, message: `Order must include a mobileNumber` });
    if (!dishes || Array.isArray(dishes) === false || dishes.length <= 0) next({ status: 400, message: "Order must include at least one dish" });

    let errorIndex;
    const hasQuantity = dishes.every((dish, index) => {
        if (!dish.quantity || dish.quantity <= 0 || typeof dish.quantity !== "number") {
            errorIndex = index;
            return false
        }
        return true
    })

    if (hasQuantity === false) next({ status: 400, message: `Dish ${errorIndex} must have a quantity that is an integer greater than 0` });
    next();
}

// Check for whether a status prop with valid values was inlcuded in request
const doesStatusPropExist = (req, res, next) => {
    const { data: { status } = {} } = req.body;

    if (!status || typeof status !== "string") next({ status: 400, message: `Order must have a status of pending, preparing, out-for-delivery, delivered` });
    if (status === "delivered") next({ status: 400, message: `A delivered order cannot be changed` });
    if (status === "pending" || status === "preparing" || status === "out-for-delivery") {
        next();
    } else {
        next({ status: 400, message: `Order must have a status of pending, preparing, out-for-delivery, delivered` });
    }
}

// Check whether orderId param matches id key from request body
const doesIdMatch = (req, res, next) => {
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;

    if (!id) next();

    if (orderId === id) {
        next();
    } else {
        next({ status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.` });
    }
}

const isOrderInProgress = (req, res, next) => {
    const { matchedOrder } = res.locals;
    if (matchedOrder.status !== "pending") next({ status: 400, message: `An order cannot be deleted unless it is pending` });
    next();
}


// Route functions
const list = (req, res, next) => {
    res.status(200).json({ data: orders });
}

const create = (req, res, next) => {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    const id = nextId();
    const newOder = { id, deliverTo, mobileNumber, dishes };
    orders.push(newOder);
    res.status(201).json({ data: newOder });
}

const read = (req, res, next) => {
    const { matchedOrder } = res.locals;
    res.status(200).json({ data: matchedOrder });
}

const update = (req, res, next) => {
    const { orderId } = req.params;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = { id: orderId, deliverTo, mobileNumber, status, dishes };
    const index = orders.findIndex(order => order.id === orderId);
    orders[index] = newOrder;
    res.status(200).json({ data: newOrder });
}

const destroy = (req, res, next) => {
    const { orderId } = req.params;
    const index = orders.findIndex(order => order.id === orderId);
    orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    list,
    create: [doesReqhaveprops, create],
    read: [isThereId, doesOrderExist, read],
    update: [isThereId, doesOrderExist, doesReqhaveprops, doesIdMatch, doesStatusPropExist, update],
    delete: [isThereId, doesOrderExist, isOrderInProgress, destroy]
}