from langroid.agent.special import TaskBasedAgent

def create_designer_agent():
    return TaskBasedAgent(
        name="Designer",
        system_message="You are a UX designer. Describe the UX flow, wireframe layout, and visual hierarchy."
    )
