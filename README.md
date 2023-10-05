# Generate PDF based on JSON File

## Installation

1. Install node.js (any version higher than v14)
2. Rename `.env.example` into `.env`. You can customize the style here.
3. Install dependencies
    ```bash
        npm install
    ```

## Execution

Run `npm start`.

## Result

The Node.js generate `output.pdf` in the project directory.  

## To generate other contents

Edit `advice-mini.js` with the following format.
```json
{
    "name-key": {
        "name": String,
        "company": String,
        "content": JSON.stringify([{
            "advice": String,
            "adviceTitle": String,
            "reference": String,
            "question": String
        }])
    }
}
``````

## Contributor

Vladyslav Ohorodnyk