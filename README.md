# Vibe Spotify

A VS Code extension that allows control of Spotify playback directly from the editor status bar.

## Features

- Play/Pause Spotify playback
- Skip to next/previous track
- Status bar indicator showing current playback state

## Setup

1. Install the extension in VS Code
2. Create a Spotify Developer account at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
3. Create a new application in the dashboard
4. Get your Client ID and Client Secret
5. Configure the extension in VS Code settings:
   - Open VS Code settings
   - Search for "Vibe Spotify"
   - Enter your Client ID and Client Secret

## Usage

The extension adds the following commands to VS Code:

- `Vibe: Start/Resume Playback` - Start or resume Spotify playback
- `Vibe: Pause Playback` - Pause Spotify playback
- `Vibe: Next Track` - Skip to the next track
- `Vibe: Previous Track` - Skip to the previous track

You can access these commands through:
- The Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
- The status bar icon
- Keyboard shortcuts (you can configure these in VS Code settings)

## Requirements

- VS Code 1.60.0 or higher
- A Spotify Premium account
- Node.js and npm (for development)

## Development

1. Clone this repository
2. Run `npm install` and `npm run compile`
3. Open the project in VS Code
5. Press F5 to start debugging

## License

MIT 
