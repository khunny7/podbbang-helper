import PropTypes from 'prop-types';
import { DefaultButton } from '@fluentui/react/lib/Button';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import { Stack } from '@fluentui/react';

const ChannelListItem = (props) => {
    const {
        title,
        description,
        id,
        image,
        onChannelSelected,
        // updatedAt,
    } = props;

    const classNames = mergeStyleSets({
        itemCell: {
            height: 160,
            width: '100%',
            margin: 5,
            textAlign: 'left',
            '& span': {
                justifyContent: 'left',
                alignItems: 'left',
            },
        },
    });

    return (
        <DefaultButton
            className={classNames.itemCell}
            onClick={() => onChannelSelected(id)}>
            <Stack
                horizontal
                disableShrink>
                <Stack.Item align='start'>
                    <img src={image} alt={title} />
                </Stack.Item>
                <Stack
                    horizontal={false}
                    disableShrink={false}>
                    <Stack.Item align='auto'>
                        {title}
                    </Stack.Item>
                    <Stack.Item align='auto'>
                        {description}
                    </Stack.Item>
                    <Stack.Item align='auto'>
                        {id}
                    </Stack.Item>
                </Stack>
            </Stack>
        </DefaultButton>
    )
};

ChannelListItem.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    image: PropTypes.string.isRequired,
    // updatedAt: PropTypes.string.isRequired,
    onChannelSelected: PropTypes.func.isRequired,
};

export { ChannelListItem }