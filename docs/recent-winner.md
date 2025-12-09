#Slack post:

Hi !
Here is a new submission for this exciting winter-challenge : a new shortcut, specially designed for Christmas ;)

https://jbg.craft.me/2NH8PDHi06Yvsx

I use it to keep track of my list of gifts (to give or already given), in the form of a collection: each item corresponds to a gift, with the name of the recipient(s), the name of the giver(s), the occasion (Christmas, birthday, etc.), and the URL link to the gift. A checkbox lets you indicate whether the gift has already been given or not.
It's very easy to configure : just create your collection, enable API, and fill in API link, API key and collection ID !
I hope you’ll like it!
@Lisa at Craft @Viktor at Craft #productivity-workflows-submission  (edited) 


Demo

TL/DR
An iOS Shortcut, specially designed for Christmas, that adds any item to a gift list, structured as a collection, with the following properties: title, recipient, giver, occasion, url link, given / to give.

Shortcut link
Context
I keep track of my list of gifts (to give or already given), in the form of a collection: each item corresponds to a gift, with the name of the recipient(s), the name of the giver(s), the occasion (Christmas, birthday, etc.), and the URL link to the gift. 

A checkbox lets me indicate whether the gift has already been given or not.

I can filter this collection to see :

•
All gifts already given to a specific person

•
All gifts already given by a specific person

•
All gifts given or planned for a specific occasion (e.g. next Christmas). 

This is particularly useful :

•
To save gift ideas for later

•
To plan Christmas shopping when you have a big family ;)

I used to add items manually but I thought Craft’s API could help me to speed up my workflow. 

How it works
As detailed in the Shortcut comments, the workflow:

1.
Asks for the gift’s title (except if you invoke the shortcut from the share sheet, in which case the title is automatically generated), recipient(s)

2.
Asks for name of recipient(s) and giver(s) and for occasion (you can select one or several properties in a multi-choice list or add a new one selecting “other”)

3.
Asks if this gift was already given or is planned for later  

4.
Asks for an url link (except if you invoke the shortcut from the share sheet, in which case the url is automatically saved)

5.
Creates a new item in the Gift List collection, with a rich link to the article. 

How to use it
As an iOS Shortcut, it can be triggered:

•
From the iOS share sheet, directly in Safari (or any app that provides a URL)

•
Or directly (you will be able to provide an url link manually or to  skip this step and leave the url field empty)

Prerequisites
Before using the shortcut:

•
In Craft:
•
Create the “Gifts” document and the “Gift List” collection (with all fields used by the Shortcut: title, “for”= recipient, “by” = giver, “occasion”, “given”, and "link").

•
“For”, “By” and “Occasion” must be multi select properties.

•
“Given” is a Boolean field (checkbox)

•
“Link” is an url field.

•
Enable the API so it can access the “gifts” document.

•
In Shortcuts:
•
Insert your API link and key

•
“APILink” is a chain of characters, used in the API call, between ‘links/‘ and ‘/api’)

•
“APIKey” is needed only if your API is protected with a key.

•
Insert your collection ID 

NB: you can find it using an API call : 

https://connect.craft.do/links/[APILink]/api/v1/collections.

•
Customize lists of recipients, givers and occasions.

•
Select your space and document in the last step of the shortcut.

•
Make sure  “in share sheet” is enabled in the info panel.

