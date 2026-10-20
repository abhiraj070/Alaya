# Memory Universe

Memory Universe is a visual way to browse the things you have saved in Alaya. Instead of showing only a list of files and notes, it turns them into stars in a space you can move around.

Think of it as a bookshelf drawn as a night sky. Each star points to one saved item. You can look around, find an item, read its details, and open its original source.

For installation and startup commands, use the [frontend setup guide](frontend/README.md).

## What does a star represent?

Each star represents one saved upload in your Alaya account:

| Saved item | Star color | Example |
| --- | --- | --- |
| Document | Red | A PDF receipt or a Word document. |
| Image | Blue | A photo, screenshot, or scanned receipt. |
| Text | Yellow | A note, personal fact, or reminder saved as text. |

If you save two documents, one image, and three text entries, your universe has six stars. A long document still produces one star in this view, even if Alaya breaks it into many smaller pieces to answer questions about it.

A star can appear as soon as the upload has been saved. You do not have to wait for Alaya to finish reading it. Seeing a star confirms that the source is saved; it does not confirm that AI processing succeeded or that the content is ready for question answering.

Hovering over or selecting a star temporarily changes its appearance to help you follow what you are looking at.

## How does it get your information?

Memory Universe uses the same account and saved information as the main Alaya app. You do not create another account or upload your files again.

1. You sign in to Alaya and click **Memory Universe**.
2. Alaya asks its server for a fresh access token. This is a temporary proof that you are signed in.
3. Alaya opens the 3D view in a new tab and passes that token to it.
4. The new tab asks the same server for your saved uploads. The server uses your signed-in identity to return your records.
5. The browser turns those records into stars and draws the scene.

The token is kept in that tab's session storage so the tab can make later requests. If authentication fails, the interface shows an error and asks you to sign in again.

There is one shared backend and one shared database behind both interfaces. Memory Universe is another view of your uploads, rather than a second place where you must maintain them.

## How are the stars arranged?

The browser gives each saved item a position in the scene using a repeatable layout calculation. The calculation uses the items' order, their IDs, and how many items are loaded. Adding or removing items can change their positions.

The live view groups items into Documents, Images, and Text. These groups help you narrow down what you see.

A short distance between two stars does not currently mean their contents have similar meanings. The positions and connection lines help present the collection visually. Nearby suggestions use distance in this displayed space and give some preference to items in the same group. Their distance labels are display units, not an AI similarity score.

Alaya also has a separate background process that can calculate positions from the meaning of processed knowledge. The current upload-based Memory Universe does not use those positions. Its stars can load even when that separate process has not run.

## What can you do in the universe?

### Move around

You can rotate the view, move across it, and zoom in or out. Search results and nearby-item actions can move the camera toward a chosen star. **Reset View** brings you back to the overview.

You can also show or hide the coordinate grid and switch the glow effect, called bloom, on or off. Camera movement respects the browser's reduced-motion preference.

### Preview and inspect an item

Hover over a star for a short preview. Select it to open a side panel with its available content, type, saved date, and source information.

For text entries, the saved text is available in the loaded record. For documents and images, the record points to the original uploaded source, which you can open through the available source action. This view uses the saved upload details; it does not fetch all of a document's extracted pieces when you select its star.

### Search and filter

Search looks through the information already loaded in the browser, including titles, previews, source names, types, and groups. Results are ranked by text matches.

Filters let you narrow the scene by source, group, or item type. For example, you can focus on documents or show items from a particular source.

This search helps you find displayed uploads. To ask a question that needs the contents of documents, meaning-based search, or a calculation, use the main Alaya chat.

### Explore nearby items

The detail panel can suggest other stars near the selected item. Choosing one lets you continue browsing the collection. These suggestions follow the displayed layout; they do not establish that two documents discuss the same topic.

## When does it update?

Memory Universe asks the server for your latest uploads:

- When the tab first opens.
- When you return focus to the tab.
- When you click **Refresh**.

For example, you can save a note in Alaya and return to the Universe tab to load it as a new star. Deleting an upload in Alaya removes it from the scene after the next successful reload.

The view does not receive continuous push updates. It reads the latest list at those moments. If an older request is still running when a newer one starts, the older request is cancelled so it cannot replace newer information.

## What happens when you have no uploads?

After the server successfully confirms that your account has no saved uploads, Memory Universe offers a sample universe. It contains **84 example stars across three groups**, with sample details and document previews so you can try the interface.

An amber **Demo** badge shows that you are looking at examples. These examples are not written into your account or database.

- **Explore Universe** checks your account again before entering the sample view. If you have saved something since the introduction appeared, your real uploads take priority.
- **Refresh** checks for real uploads and replaces the examples when any exist.
- **Exit Demo** reloads your real collection, which may show an empty state until you save something.

A failed connection or expired sign-in is shown as an error. It is not treated as proof that your account is empty, so it does not trigger the demo.

## A simple example

Suppose you save a laptop receipt as a PDF, a photo of the laptop, and a text note saying when you bought it.

When you open Memory Universe, you see three stars: one red, one blue, and one yellow. You can select the red star to inspect the receipt's source, find the note through text search, or filter the scene to images to see the photo.

Meanwhile, Alaya's background worker can read the receipt and prepare its contents for questions. Once processing finishes, you can return to Alaya chat and ask how much the laptop cost. The 3D view helps you browse the sources; the chat uses processed knowledge to answer questions.

For technical architecture and API details, see [Memory Universe in the root guide](../README.md#4-memory-universe).
