from langroid.agent.special import TaskBasedAgent

def create_analyst_agent():
    return TaskBasedAgent(
        name="Analyst",
        system_message="You are a data/product analyst. Define KPIs, metrics, and suggest experiments or dashboards."
    )
