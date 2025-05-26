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

This project wouldn't be possible without the work of the open-source community. Special thanks to the following projects:

- [**git2json by fabien0102**](https://github.com/fabien0102/git2json) - No License
  Inspired the Git-to-JSON conversion logic. This functionality has been fully reimplemented in Rust for GitTaur's backend.

- [**gitgraph.js by nicoespeon**](https://github.com/nicoespeon/gitgraph.js/) - MIT License
  Used as the foundation for GitTaur’s graph rendering. A custom fork was adapted to meet the specific needs of the app.

- [**auth-git2-rs by de-vri-es**](https://github.com/de-vri-es/auth-git2-rs) - BSD-2-Clause License
  Provided crucial utilities for handling authentication for `git2-rs` backend operations.

GitTaur uses many additional open-source crates and packages from the Rust and JavaScript/React ecosystems. For a complete list of all libraries and licenses, see the [CREDITS.md](CREDITS.md).
