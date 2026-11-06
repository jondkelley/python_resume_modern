# Description : convert resume.json into a RenderCV (https://github.com/rendercv/rendercv) document


def to_rendercv(resume, max_bullets=5):
    """ returns a RenderCV dict; max_bullets matches resume.md.jinja2 """
    p, c = resume['profile'], resume['contact_details']
    loc = p['current_location']
    cv = {
        'name': ' '.join(filter(None, [p['first_name'], p['middle_name'], p['last_name']])),
        'headline': p['tagline'],
        'location': f"{loc['city']}, {loc['state']}",
        'email': c['email'],
        'website': c['website'],
        'social_networks': [{
            'network': 'LinkedIn',
            'username': c['linkedin'].rstrip('/').rsplit('/', 1)[-1]}],
        'custom_connections': [{
            'fontawesome_icon': 'key', 'placeholder': 'Keybase', 'url': c['keybase']}],
        'sections': {},
    }
    s = cv['sections']
    if p['biography']:
        s['Summary'] = [p['biography']]
    s['Experience'] = [{
        'company': j['title'],
        'position': j['specification'],
        'location': j['location'],
        'start_date': j['start_date'][:7],
        'end_date': j['end_date'][:7] if j['end_date'] else 'present',
        'highlights': j['accomplishments'][:max_bullets],
    } for j in resume['careers']]
    s['Education'] = [{
        'institution': e['title'],
        'area': e['specification'],
        'degree': e['level'],
        'location': e['location'],
        'summary': e['description'],
    } for e in resume['educations']]
    for label, key in (('DevOps Tools', 'skills_devops_tools'), ('CI/CD', 'skills_ci_cd'),
                       ('Hypervisors', 'skills_hypervisors'), ('Skills', 'skills')):
        if resume[key]:
            s.setdefault('Skills', []).append({
                'label': label, 'details': ', '.join(i['title'] for i in resume[key])})
    if resume['projects']:
        s['Code Portfolio'] = [{
            'name': f"[{j['title']}]({j['link']})",
            'summary': j['description']} for j in resume['projects']]
    return {'cv': cv}
