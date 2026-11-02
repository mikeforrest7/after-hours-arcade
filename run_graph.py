"""Validate and query the arcade plan; never launch games, agents or purchases."""
import argparse
import json
from pathlib import Path


def validate(graph, root):
    tasks = graph['tasks']
    by_id = {task['id']: task for task in tasks}
    if len(by_id) != len(tasks):
        raise ValueError('Duplicate task IDs')
    required_games = {'R-GT', 'R-BBH', 'R-SS', 'R-JP'}
    if not required_games.issubset({r['id'] for r in graph['requirements']}):
        raise ValueError('A named game requirement is missing')
    for requirement in graph['requirements']:
        if requirement['verified_by'] not in by_id:
            raise ValueError(f"Unknown verification task for {requirement['id']}")
    for task in tasks:
        if task['state'] not in {'done', 'planned', 'blocked'}:
            raise ValueError(f"Invalid state: {task['id']}")
        if not isinstance(task['hours'], (int, float)) or task['hours'] < 0:
            raise ValueError(f"Invalid estimate: {task['id']}")
        if task['state'] == 'blocked' and not task.get('blocker'):
            raise ValueError(f"Missing blocker: {task['id']}")
        for dependency in task['depends']:
            if dependency not in by_id:
                raise ValueError(f"Unknown dependency {dependency} on {task['id']}")
        if task['state'] == 'done':
            if not task.get('evidence'):
                raise ValueError(f"Missing evidence: {task['id']}")
            for evidence in task['evidence']:
                target = (root / evidence).resolve()
                if not target.is_relative_to(root.resolve()) or not target.is_file():
                    raise ValueError(f"Missing or out-of-project evidence: {evidence}")
    for risk in graph.get('risks', []):
        if not set(risk['affects']).issubset(by_id):
            raise ValueError(f"Unknown risk target: {risk['id']}")
    ordered = []
    remaining = dict(by_id)
    seen = set()
    while remaining:
        wave = [key for key, task in remaining.items() if set(task['depends']) <= seen]
        if not wave:
            raise ValueError('Dependency cycle: ' + ', '.join(remaining))
        ordered.extend(wave)
        seen.update(wave)
        for key in wave:
            del remaining[key]
    for task in tasks:
        if task['state'] == 'done' and any(by_id[d]['state'] != 'done' for d in task['depends']):
            raise ValueError(f"Done task has unfinished prerequisite: {task['id']}")
    return by_id, ordered


def report(graph, root, changed=None):
    by_id, ordered = validate(graph, root)
    done = {key for key, task in by_id.items() if task['state'] == 'done'}
    ready = [key for key in ordered if by_id[key]['state'] == 'planned' and set(by_id[key]['depends']) <= done]
    blocked = {key: task['blocker'] for key, task in by_id.items() if task['state'] == 'blocked'}
    finish, path = {}, {}
    for key in ordered:
        task = by_id[key]
        parent = max(task['depends'], key=lambda d: finish[d], default=None)
        finish[key] = (finish[parent] if parent else 0) + (0 if key in done else task['hours'])
        path[key] = (path[parent] if parent else []) + ([] if key in done else [key])
    end = max(ordered, key=lambda key: finish[key])
    result = {
        'valid': True,
        'task_count': len(by_id),
        'completed_planning_tasks': sorted(done),
        'ready_unblocked': ready,
        'external_gates': blocked,
        'unfinished_person_hours': sum(t['hours'] for t in by_id.values() if t['state'] != 'done'),
        'ideal_dependency_path_hours': finish[end],
        'ideal_dependency_path': path[end],
        'schedule_caveat': 'Not a calendar forecast: ignores procurement lead times, approval waits, shared-person contention and any new reverse-engineering development.',
        'execution_boundary': 'Read-only planning query. No games, agents, purchases, fabrication or external actions executed.'
    }
    if changed is not None:
        if changed not in by_id:
            raise ValueError(f'Unknown changed task: {changed}')
        impacted = {changed}
        for key in ordered:
            if impacted.intersection(by_id[key]['depends']):
                impacted.add(key)
        result['invalidate_or_recheck'] = [key for key in ordered if key in impacted]
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--graph', type=Path, default=Path(__file__).with_name('engineering-graph.json'))
    parser.add_argument('--changed', help='Print this task and every downstream task to recheck')
    args = parser.parse_args()
    try:
        graph = json.loads(args.graph.read_text(encoding='utf-8'))
        print(json.dumps(report(graph, args.graph.parent, args.changed), indent=2))
    except (ValueError, KeyError, OSError, TypeError) as error:
        parser.exit(1, f'Graph invalid: {error}\n')


if __name__ == '__main__':
    main()
