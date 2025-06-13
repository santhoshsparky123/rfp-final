from langchain_community.utilities import WikipediaAPIWrapper
from langchain_community.tools import Tool, WikipediaQueryRun

wiki_api = WikipediaAPIWrapper(WIKIPEDIA_API_URL="https://en.wikipedia.org/w/api.php")
wiki_tool = WikipediaQueryRun(api_wrapper=wiki_api)

WikipediaTool = Tool(
    name="WikipediaTool",
    func=wiki_tool.run,
    description="Use for general background information or definitions not found in internal docs."
)
