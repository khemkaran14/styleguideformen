# Real photo pack for the men’s site

The women’s site works because every photo is an **edit of one base photo**, so the model, pose and framing match exactly and the Dressing Room can lay real pieces over the model. These five prompts do the same for the men’s site.

| Chat | File | Attach | Images |
|---|---|---|---|
| 1 | 1-base-model.txt | your model’s face photo | 2 |
| 2 | 2-outfits.txt | base/base.png | 42 |
| 3 | 3-try-on-pieces.txt | base/base.png | 74 |
| 4 | 4-hairstyles.txt | base/portrait.png | 26 |
| 5 | 5-beards.txt | base/portrait.png | 9 |

**How to run each chat**
1. Start a **new chat** (ChatGPT or Gemini). Gemini is especially good at keeping edits aligned.
2. Attach the file shown above, paste the whole prompt, send.
3. It makes one image at a time. Check it, then reply **next**. If one is wrong, reply “redo” with what to fix.
4. At the end, ChatGPT: reply **zip**. Gemini: download each image and name it as shown.
5. Do chat 1 first and be happy with the base photos before starting the others: everything is built from them.

Send the zips (or folders) to Claude. They will be checked one by one, and the Dressing Room masks and colour maps will be made from them, like the women’s site. You can send partial sets; anything missing keeps its illustration for now.

Only use a face you have the rights to: yourself, a model who agreed, or an AI-generated face.
