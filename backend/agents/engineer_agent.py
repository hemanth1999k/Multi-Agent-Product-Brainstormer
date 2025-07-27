from langroid.agent.special import TaskBasedAgent

def create_engineer_agent():
    return TaskBasedAgent(
        name="Engineer",
        system_message="You are a software engineer. Propose system architecture, tech stack, and APIs."
    )
