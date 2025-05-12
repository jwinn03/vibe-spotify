import * as vscode from 'vscode';
import SpotifyWebApi from 'spotify-web-api-node';
import open from 'open';
import * as http from 'http';

let spotifyApi: SpotifyWebApi;
let statusBarItems: { [key: string]: vscode.StatusBarItem } = {};
let accessToken: string | null = null;

export function activate(context: vscode.ExtensionContext) {
    // Create status bar items first, before any other initialization
    statusBarItems.play = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
    statusBarItems.play.command = 'vibe-spotify.start';
    statusBarItems.play.tooltip = 'Start/Resume Playback';
    statusBarItems.play.text = '▶️';
    statusBarItems.play.show();

    statusBarItems.pause = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
    statusBarItems.pause.command = 'vibe-spotify.pause';
    statusBarItems.pause.tooltip = 'Pause Playback';
    statusBarItems.pause.text = '⏸️';
    statusBarItems.pause.show();

    statusBarItems.next = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
    statusBarItems.next.command = 'vibe-spotify.next';
    statusBarItems.next.tooltip = 'Next Track';
    statusBarItems.next.text = '⏭️';
    statusBarItems.next.show();

    statusBarItems.previous = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItems.previous.command = 'vibe-spotify.previous';
    statusBarItems.previous.tooltip = 'Previous Track';
    statusBarItems.previous.text = '⏮️';
    statusBarItems.previous.show();

    // Add all status bar items to subscriptions
    Object.values(statusBarItems).forEach(item => context.subscriptions.push(item));

    // Initialize Spotify API
    const config = vscode.workspace.getConfiguration('vibeSpotify');
    const clientId = config.get<string>('clientId');
    const clientSecret = config.get<string>('clientSecret');

    if (!clientId || !clientSecret) {
        vscode.window.showErrorMessage('Please configure your Spotify Client ID and Client Secret in the settings.');
        return;
    }

    spotifyApi = new SpotifyWebApi({
        clientId: clientId,
        clientSecret: clientSecret,
        redirectUri: 'http://127.0.0.1:8888/callback'
    });

    // Register commands
    let startCommand = vscode.commands.registerCommand('vibe-spotify.start', async () => {
        if (!accessToken) {
            await authenticateWithSpotify();
            return;
        }
        try {
            await spotifyApi.play();
            updateStatusBarState('playing');
        } catch (error) {
            vscode.window.showErrorMessage('Failed to start playback. Please make sure you are authenticated.');
            updateStatusBarState('error');
        }
    });

    let pauseCommand = vscode.commands.registerCommand('vibe-spotify.pause', async () => {
        if (!accessToken) {
            await authenticateWithSpotify();
            return;
        }
        try {
            await spotifyApi.pause();
            updateStatusBarState('paused');
        } catch (error) {
            vscode.window.showErrorMessage('Failed to pause playback.');
            updateStatusBarState('error');
        }
    });

    let nextCommand = vscode.commands.registerCommand('vibe-spotify.next', async () => {
        if (!accessToken) {
            await authenticateWithSpotify();
            return;
        }
        try {
            await spotifyApi.skipToNext();
            updateStatusBarState('playing');
        } catch (error) {
            vscode.window.showErrorMessage('Failed to skip to next track.');
            updateStatusBarState('error');
        }
    });

    let previousCommand = vscode.commands.registerCommand('vibe-spotify.previous', async () => {
        if (!accessToken) {
            await authenticateWithSpotify();
            return;
        }
        try {
            await spotifyApi.skipToPrevious();
            updateStatusBarState('playing');
        } catch (error) {
            vscode.window.showErrorMessage('Failed to skip to previous track.');
            updateStatusBarState('error');
        }
    });

    context.subscriptions.push(startCommand, pauseCommand, nextCommand, previousCommand);

    // Check if we have a stored access token
    const storedToken = context.globalState.get<string>('spotifyAccessToken');
    if (storedToken) {
        accessToken = storedToken;
        spotifyApi.setAccessToken(accessToken);
        updateStatusBarState('ready');
    } else {
        updateStatusBarState('ready');
    }
}

function updateStatusBarState(state: 'playing' | 'paused' | 'ready' | 'error') {
    switch (state) {
        case 'playing':
            statusBarItems.play.text = '▶️';
            statusBarItems.pause.text = '⏸️';
            break;
        case 'paused':
            statusBarItems.play.text = '▶️';
            statusBarItems.pause.text = '⏸️';
            break;
        case 'ready':
            statusBarItems.play.text = '▶️';
            statusBarItems.pause.text = '⏸️';
            break;
        case 'error':
            statusBarItems.play.text = '▶️';
            statusBarItems.pause.text = '⏸️';
            break;
    }
}

async function authenticateWithSpotify() {
    try {
        const scopes = ['user-read-playback-state', 'user-modify-playback-state'];
        const state = 'some-state-of-my-choice';
        const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

        // Create a temporary server to handle the callback
        const server = http.createServer(async (req, res) => {
            const url = new URL(req.url!, 'http://127.0.0.1:8888');
            const code = url.searchParams.get('code');
            
            if (code) {
                try {
                    const data = await spotifyApi.authorizationCodeGrant(code);
                    accessToken = data.body['access_token'];
                    spotifyApi.setAccessToken(accessToken);
                    
                    // Store the access token
                    vscode.commands.executeCommand('setContext', 'spotify.authenticated', true);
                    
                    // Send success response to browser
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end('<html><body><h1>Authentication successful!</h1><p>You can close this window and return to VS Code.</p></body></html>');
                    
                    // Close the server after successful authentication
                    server.close();
                    
                    updateStatusBarState('ready');
                    vscode.window.showInformationMessage('Successfully authenticated with Spotify!');
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'text/html' });
                    res.end('<html><body><h1>Authentication failed</h1><p>Please try again.</p></body></html>');
                }
            }
        });

        server.listen(8888, () => {
            // Open the authorization URL in the default browser
            open(authorizeURL);
        });
    } catch (error) {
        vscode.window.showErrorMessage('Failed to authenticate with Spotify.');
    }
}

export function deactivate() {
    Object.values(statusBarItems).forEach(item => item.dispose());
} 