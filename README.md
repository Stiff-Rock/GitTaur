## GitTaur - A fast and simple Git GUI built with Tauri

GitTaur is a Git GUI built to take advantage of the speed and efficiency of Rust and the modern UX of React.

## How to run
Currently, the app is in a very early stage, with a lot of bugs and missing core functionalites, but if you wish to run it either way,
clone the repository, run `npm install` in the root folder and `cargo build` to download all the frontend and backend dependencies. 

### Windows
Run `npm run tauri dev` or use the run script with `npm run app` on the root folder

### Linux
You'll need to run two terminals, one to execute `cargo run` on the `src-tauri` folder and another to start the frontend in the root folder with `npm run dev`. 

## Credits
cargo about generate about.hbs > CREDITS-backcend.md
npx license-checker --markdown > CREDITS-frontend.md
