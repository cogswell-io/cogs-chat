This is a very simple example of the new Cogswell.io Pub/Sub product. It is a command-line chat client which can be bound to any user's Cogswell account.

Simple create a JSON file containing a _keys_ property which is an array with read and write auth keys.

```json
{
  "keys": [
    "R-0123456789abcdef-0f1e2d3c4b5a6978"
    "W-0123456789abcdef-f0e1d2c3b4a59687"
  ]
}
```

Then launch the chat client using your custom JSON config file, a username, and a channel
```bash
$ cogs-chat -f path/to/custom.json MyUserName ChatChannel
```

