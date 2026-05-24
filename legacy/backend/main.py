from agents.pm_agent import create_pm_agent
from agents.designer_agent import create_designer_agent
from agents.engineer_agent import create_engineer_agent
from agents.analyst_agent import create_analyst_agent

def run_brainstorm(idea: str):
    pm = create_pm_agent()
    designer = create_designer_agent()
    engineer = create_engineer_agent()
    analyst = create_analyst_agent()

    messages = []

    pm_output = pm.run(idea)
    messages.append(("PM", pm_output))

    designer_output = designer.run(idea + "\n" + pm_output)
    messages.append(("Designer", designer_output))

    engineer_output = engineer.run(idea + "\n" + designer_output)
    messages.append(("Engineer", engineer_output))

    analyst_output = analyst.run(idea + "\n" + engineer_output)
    messages.append(("Analyst", analyst_output))

    with open("../outputs/brainstorm_output.md", "w") as f:
        f.write("# MVP Spec\n")
        f.write(f"\n## Product Idea\n{idea}\n")
        for role, output in messages:
            f.write(f"\n## {role} Response\n{output}\n")

    return messages

if __name__ == "__main__":
    run_brainstorm("AI-powered resume reviewer")
