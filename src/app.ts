import express from "express";
import { prisma } from "../prisma/prisma-instance";
import { errorHandleMiddleware } from "./error-handler";
import "express-async-errors";

const app = express();
app.use(express.json());
// All code should go below this line
app.get("/", (_req, res) => {
  res.json({ message: "Hello World!" }).status(200); // the 'status' is unnecessary but wanted to show you how to define a status
});

const validKeys: string[] = [
  "age",
  "name",
  "description",
  "breed",
];

//index endpoint
app.get("/dogs", async (req, res) => {
  const characters = await prisma.dog.findMany();
  res.send(characters);
});

// show endpoint Prisma
app.get("/dogs/:id", async (req, res) => {
  const id = +req.params.id;

  if (isNaN(id)) {
    return res
      .status(400)
      .send({ message: "id should be a number" });
  }
  const dog = await prisma.dog.findUnique({
    where: {
      id,
    },
  });
  if (!dog) {
    return res.status(204).send("no data");
  }
  res.send(dog);
});

//delete
app.delete("/dogs/:id", async (req, res) => {
  const id = +req.params.id;

  if (isNaN(id)) {
    return res
      .status(400)
      .send({ message: "id should be a number" });
  }

  const dog = await prisma.dog.findUnique({
    where: {
      id,
    },
  });
  const deleted = await Promise.resolve()
    .then(() =>
      prisma.dog.delete({
        where: {
          id,
        },
      })
    )
    .catch(() => null);
  if (deleted === null) {
    return res.status(204).send({ error: "Dog not found" });
  }
  return res.status(200).send(dog);
});

//create
app.post("/dogs", async (req, res) => {
  const body = req.body;
  const { name, breed, description, age } = body;
  const errors: string[] = [];

  for (const [key, _value] of Object.entries(body)) {
    const isValidKey: boolean = validKeys.includes(key);
    if (!isValidKey) {
      errors.push(`'${key}' is not a valid key`);
    }
  }

  if (typeof name !== "string") {
    errors.push("name should be a string");
  }
  if (typeof breed !== "string") {
    errors.push("breed should be a string");
  }
  if (typeof description !== "string") {
    errors.push("description should be a string");
  }
  if (isNaN(age) || typeof age !== "number") {
    errors.push("age should be a number");
  }
  if (errors.length > 0) {
    return res.status(400).send({ errors });
  }

  try {
    const newDog = await prisma.dog.create({
      data: {
        name,
        breed,
        description,
        age: +age,
      },
    });
    res.status(201).send(newDog);
  } catch (e) {
    console.log(e);
    res.status(500);
  }
});

// Edit
app.patch("/dogs/:id", async (req, res) => {
  const id = +req.params.id;
  const body = req.body;
  const errors: string[] = [];

  for (const [key, value] of Object.entries(body)) {
    //check if valid key
    const isValidKey: boolean = validKeys.includes(key);
    if (!isValidKey) {
      errors.push(`'${key}' is not a valid key`);
    }

    if (typeof value !== "number" && key === "age") {
      errors.push(`'${key}' should be a number`);
    }
    if (
      typeof value !== "string" &&
      key !== "age" &&
      isValidKey
    ) {
      errors.push(`'${key}' should be a string`);
    }
  }
  if (errors.length > 0) {
    return res.status(400).send({ errors });
  }
  try {
    const updateDog = await prisma.dog.update({
      where: {
        id,
      },
      data: body,
    });
    res.status(201).send(updateDog);
  } catch (e) {
    console.log(e);
    res.status(500);
  }
});

// all your code should go above this line
app.use(errorHandleMiddleware);

const port = process.env.NODE_ENV === "test" ? 3001 : 3000;
app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}
`)
);
