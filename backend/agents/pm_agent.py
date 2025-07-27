from langroid.agent.special import TaskBasedAgent

def create_pm_agent():
    return TaskBasedAgent(
        name="Product Manager",
        system_message="You are a PM. Define product goals, constraints, personas, and MVP scope."
    )
