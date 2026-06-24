# Chapter 3 — JavaScript You Need

React apps are written in JavaScript (with TypeScript on top). You need about 20% of the language to build anything. Here's that 20%.

## Variables

```javascript
// let — can change later
let count = 0;
count = 1;           // OK

// const — cannot change (use this by default)
const name = 'Alice';
name = 'Bob';        // ERROR

// var — old way, don't use
```

## Data types

```javascript
const str = 'hello';          // string
const num = 42;               // number
const bool = true;            // boolean
const nothing = null;         // null (intentional empty)
const notDefined = undefined; // undefined (not assigned)
```

## Arrays (lists of things)

```javascript
const fruits = ['apple', 'banana', 'cherry'];
fruits.length;                // 3
fruits[0];                    // 'apple' (zero-indexed)
fruits.push('date');          // add to end — ['apple','banana','cherry','date']
fruits.map(f => f.toUpperCase()); // ['APPLE','BANANA','CHERRY','DATE']
fruits.filter(f => f.startsWith('a')); // ['apple']
fruits.find(f => f === 'banana');      // 'banana'
```

**`map`, `filter`, `find`** are used constantly in React to turn data into components.

## Objects (key-value pairs)

```javascript
const user = {
  name: 'Alice',
  age: 30,
  isAdmin: false,
};

user.name;            // 'Alice'
user['name'];         // 'Alice'
user.age = 31;        // update

const { name, age } = user;  // destructuring — pulls properties out
```

## Functions

```javascript
// Regular function
function add(a, b) {
  return a + b;
}

// Arrow function (preferred in React)
const add = (a, b) => a + b;

const greet = (name) => {
  return `Hello, ${name}!`;  // template literal with backticks
};

// Function as a value (passed around like a variable)
const double = (x) => x * 2;
[1, 2, 3].map(double);       // [2, 4, 6]
```

## Conditional logic

```javascript
const age = 20;
let message;

if (age >= 18) {
  message = 'Adult';
} else {
  message = 'Minor';
}

// Ternary (shorter, used in JSX)
const message = age >= 18 ? 'Adult' : 'Minor';

// Logical AND (used in React for conditional rendering)
isAdmin && <AdminPanel />   // renders AdminPanel only if isAdmin is true
```

## Async / Await (the most important modern pattern)

JavaScript runs one thing at a time. Network requests take time. `async/await` lets you write "wait for this, then continue":

```javascript
// This function pauses at `await` until the fetch completes
async function loadUsers() {
  const response = await fetch('https://api.example.com/users');
  const data = await response.json();
  return data;
}

// Error handling with try/catch
async function safeLoad() {
  try {
    const users = await loadUsers();
    console.log(users);
  } catch (error) {
    console.error('Failed to load:', error);
  }
}
```

**Every API call in this project uses this pattern.** Open `src/services/api.ts` — every method is `async` with `await`.

## Promises (the building block of async)

```javascript
// A Promise is an object that might resolve later
const promise = fetch('/api/users');
promise
  .then(res => res.json())    // runs when resolved
  .then(data => console.log(data))
  .catch(err => console.error(err));  // runs on error

// `await` is just sugar over `.then()`
```

## Common patterns you'll see in this project

```javascript
// 1. Spreading objects/arrays (copy + merge)
const defaults = { theme: 'dark', lang: 'en' };
const config = { ...defaults, lang: 'fr' };  // { theme: 'dark', lang: 'fr' }

const nums = [1, 2];
const all = [...nums, 3, 4];  // [1, 2, 3, 4]

// 2. Optional chaining (safe access)
const city = user?.address?.city;  // undefined if any is null, no crash

// 3. Nullish coalescing (default values)
const name = input ?? 'Default';   // uses 'Default' only if input is null/undefined

// 4. Dynamic object keys
const key = 'email';
const value = 'a@b.com';
const update = { [key]: value };   // { email: 'a@b.com' }
```

## See it in this project

Open `src/utils/contentDetection.ts` — it's pure JavaScript logic:

```javascript
// src/utils/contentDetection.ts
export function detectRogueContent(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return { isRogue: false };
  const words = trimmed.split(/\s+/);
  if (words.length < 10) return { isRogue: true, reason: 'Content too short' };
  // ... more checks
  return { isRogue: false };
}
```

Open `src/store/appStore.ts` — see localStorage read/write with JSON:

```javascript
export function savePosts(posts: BlogPost[]): void {
  localStorage.setItem('luminary_posts', JSON.stringify(posts));
}

export function loadPosts(): BlogPost[] {
  const raw = localStorage.getItem('luminary_posts');
  return raw ? JSON.parse(raw) : [];
}
```

## Your practice

Write a function that:
1. Takes an array of blog posts
2. Filters to only published posts
3. Sorts by date (newest first)
4. Returns the first 5

```javascript
function getRecentPosts(posts) {
  return posts
    .filter(p => p.status === 'published')
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 5);
}
```

This exact pattern appears in `src/pages/HomePage.tsx`.

In [Chapter 4](04-typescript.md), you'll add types to JavaScript and stop making bugs before they happen.
