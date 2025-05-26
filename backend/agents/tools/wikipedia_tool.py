from langchain_community.tools import Tool, WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper

wiki_tool = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper())

WikipediaTool = Tool(
    name="WikipediaTool",
    func=wiki_tool.run,
    description="Use for general background information or definitions not found in internal docs."
)
